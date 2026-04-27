/**
 * HIDDEN TEST PAGE — /game-test
 * Not linked in navigation. For rapid QA testing only.
 *
 * Features:
 *  - "⚡ 一键全转化" button: sends CHEAT_WIN to the engine iframe → all 12 people
 *    instantly converted → game ends → PostGameSummary shows.
 *  - "💰 资源→2" button: sends SET_RESOURCES=2 to the engine → fast game end.
 *  - "🔁 重置游戏" button: restarts the session (same as the normal restart flow).
 *  - Shows live DB status: whether startSession / endSession succeeded.
 *  - Full PostGameSummary overlay (本局总览 / 排行榜 / 回合日志) after game ends.
 */

import React, { useRef, useState, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trophy, RotateCcw, Zap, CheckCircle2, XCircle, Loader2, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { usePlayerName } from "@/hooks/usePlayerName";

const GAME_ENGINE_URL = "/manus-storage/game-engine_6c9b6e49.html?autoStart=1";
const SESSION_ID_KEY = "china-outbound-test-session-id";

interface HiddenTiesStats {
  total: number;
  discoveredCount: number;
  activatedCount: number;
  missedCount: number;
  discoveredPairs: string[];
  activatedPairs: string[];
  missedPairs: string[];
}

interface GameResult {
  endingType: string;
  won: boolean;
  convertedCount: number;
  totalPeople: number;
  resourcesLeft: number;
  finalCred: number;
  finalPressure: number;
  totalRounds: number;
  baseScore: number;
  conversionScore: number;
  healthScore: number;
  totalScore: number;
  history: unknown[];
  hiddenTiesStats?: HiddenTiesStats;
  aggressiveIndex?: number;
  conservativeIndex?: number;
}

interface TurnData {
  round: number;
  actionId: string;
  actionLabel: string;
  targets: string[];
  prediction: string;
  deltas: { cred: number; pressure: number; converted: number };
  credAfter: number;
  pressureAfter: number;
  weeksLeft: number;
}

type LogEntry = { ts: string; msg: string; ok: boolean };

// ─── Strategy bias helper ────────────────────────────────────────────────────
function strategyBias(agg: number, con: number) {
  const total = agg + con;
  if (total === 0) return { label: "-", color: "text-muted-foreground" };
  const ratio = agg / total;
  if (ratio >= 0.6) return { label: "⚡ 制度主导型", color: "text-amber-400 border-amber-500/40 bg-amber-500/10" };
  if (ratio <= 0.35) return { label: "💬 沟通主导型", color: "text-primary border-primary/40 bg-primary/10" };
  return { label: "⚖️ 均衡型", color: "text-green-400 border-green-500/40 bg-green-500/10" };
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-xl">🥇</span>;
  if (rank === 2) return <span className="text-xl">🥈</span>;
  if (rank === 3) return <span className="text-xl">🥉</span>;
  return <span className="text-muted-foreground font-mono text-sm w-8 text-center">#{rank}</span>;
}

// ─── Error Boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: "" };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error?.message ?? String(error) };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-4">
          <div className="text-4xl">⚠️</div>
          <div className="text-sm text-muted-foreground">加载出错，请刷新页面重试</div>
          <div className="text-xs text-red-400 font-mono max-w-xs break-all">{this.state.error}</div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Turn Log component ───────────────────────────────────────────────────────
function TurnLog({ sessionId }: { sessionId: number | null }) {
  const { data, isLoading } = trpc.game.getSession.useQuery(
    { sessionId: sessionId! },
    { enabled: sessionId != null }
  );
  if (sessionId == null) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">无会话记录</div>;
  }
  if (isLoading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">加载回合日志…</div>;
  }
  const turns = data?.turns ?? [];
  if (turns.length === 0) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">暂无回合记录</div>;
  }
  return (
    <div className="space-y-2">
      {turns.map((t, idx) => {
        const prev = idx > 0 ? turns[idx - 1] : null;
        const credDelta = prev != null ? (t.credibilityAfter ?? 0) - (prev.credibilityAfter ?? 0) : 0;
        const pressDelta = prev != null ? (t.pressureAfter ?? 0) - (prev.pressureAfter ?? 0) : 0;
        const targets = (t.targets as string[]) ?? [];
        const outcome = t.outcome;
        return (
          <div key={t.id} className="rounded-lg border border-border bg-card/40 p-3 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-muted-foreground w-12 shrink-0">R{t.round}</span>
              <span className="text-sm font-medium flex-1 min-w-0 truncate">{t.actionLabel || t.actionId}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded border shrink-0 ${
                outcome === "success"
                  ? "text-green-400 border-green-500/30 bg-green-500/10"
                  : "text-amber-400 border-amber-500/30 bg-amber-500/10"
              }`}>
                {outcome === "success" ? "✓ 转化" : "△ 部分"}
              </span>
            </div>
            {targets.length > 0 && (
              <div className="text-xs text-muted-foreground pl-14">
                目标：{targets.join("、")}
              </div>
            )}
            <div className="flex items-center gap-3 pl-14 text-xs">
              <span className="text-muted-foreground">
                可信度 <span className={credDelta > 0 ? "text-green-400" : credDelta < 0 ? "text-red-400" : "text-muted-foreground"}>
                  {credDelta > 0 ? `+${credDelta}` : credDelta !== 0 ? String(credDelta) : "±0"}
                </span>
                {" "}→ {t.credibilityAfter ?? "-"}
              </span>
              <span className="text-muted-foreground">
                压力 <span className={pressDelta < 0 ? "text-green-400" : pressDelta > 0 ? "text-red-400" : "text-muted-foreground"}>
                  {pressDelta > 0 ? `+${pressDelta}` : pressDelta !== 0 ? String(pressDelta) : "±0"}
                </span>
                {" "}→ {t.pressureAfter ?? "-"}
              </span>
              <span className="text-muted-foreground">资源 → {t.resourcesAfter ?? "-"}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Leaderboard Panel ────────────────────────────────────────────────────────
function LeaderboardPanel({ playerName, currentSessionId }: { playerName: string; currentSessionId: number | null }) {
  const { data: listData } = trpc.leaderboard.list.useQuery({ limit: 50 });
  const rows = listData ?? [];
  const currentRowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (currentRowRef.current && currentSessionId != null) {
      const t = setTimeout(() => {
        currentRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
      return () => clearTimeout(t);
    }
  }, [listData, currentSessionId]);

  if (rows.length === 0) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">暂无排行榜数据</div>;
  }
  return (
    <div className="space-y-1.5">
      {rows.map((row, i) => {
        const isMe = !!playerName && row.playerName === playerName;
        const isCurrent = row.id === currentSessionId;
        return (
          <div
            key={row.id}
            ref={isCurrent ? currentRowRef : undefined}
            className={`rounded-lg border p-2.5 ${
              isCurrent
                ? "border-primary/50 bg-primary/10"
                : isMe
                ? "border-border bg-muted/30"
                : "border-border bg-card/30"
            }`}
          >
            <div className="flex items-center gap-2">
              <RankBadge rank={i + 1} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-medium">{row.playerName ?? "匿名"}</span>
                  {isCurrent && <Badge variant="outline" className="text-[10px] px-1 py-0 border-primary/50 text-primary shrink-0">本局</Badge>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-bold text-primary">{row.totalScore?.toFixed(1) ?? "-"}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-1.5 pl-8 text-xs text-muted-foreground flex-wrap">
              <span>{row.convertedCount}/12 转化</span>
              <span>可信 {row.finalCredibility ?? "-"}</span>
              <span>压力 {row.finalPressure ?? "-"}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Post-game summary overlay ────────────────────────────────────────────────
function PostGameSummary({
  result,
  sessionId,
  playerName,
  onRestart,
  onClose,
}: {
  result: GameResult;
  sessionId: number | null;
  playerName: string;
  onRestart: () => void;
  onClose: () => void;
}) {
  const totalScore = Number(result.totalScore) || 0;
  const convertedCount = Number(result.convertedCount) || 0;
  const totalPeople = Number(result.totalPeople) || 12;
  const resourcesLeft = Number(result.resourcesLeft) || 0;
  const totalRounds = Number(result.totalRounds) || 0;
  const finalCred = Number(result.finalCred) || 0;
  const finalPressure = Number(result.finalPressure) || 0;
  const healthScore = Number(result.healthScore) || 0;
  const agg = Number(result.aggressiveIndex) || 0;
  const con = Number(result.conservativeIndex) || 0;
  const bias = strategyBias(agg, con);

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-background" style={{ overflow: "hidden" }}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/60 shrink-0">
        <div className="flex items-center gap-3">
          <Trophy className="w-5 h-5 text-primary shrink-0" />
          <div>
            <div className="text-sm font-semibold text-foreground">游戏结束 · 复盘时刻</div>
            <div className="text-xs text-muted-foreground">{playerName} · 测试模式</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right mr-1">
            <div className="text-2xl font-bold text-primary leading-none">{totalScore}</div>
            <div className="text-xs text-muted-foreground">综合得分</div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90" onClick={onRestart}>
              <RotateCcw className="w-3.5 h-3.5" />
              再测一局
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1 bg-card hover:bg-muted"
              onClick={onClose}
              title="关闭结算，返回游戏画面"
            >
              <X className="w-3.5 h-3.5" />
              关闭结算
            </Button>
          </div>
        </div>
      </div>
      {/* Tabs */}
      <div className="flex flex-col flex-1 min-h-0">
        <Tabs defaultValue="overview" className="flex flex-col flex-1 min-h-0 gap-0">
          <div className="px-4 pt-3 pb-1 shrink-0 border-b border-border/50">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="overview" className="flex-1 sm:flex-none">📊 本局总览</TabsTrigger>
              <TabsTrigger value="leaderboard" className="flex-1 sm:flex-none">🏆 排行榜</TabsTrigger>
              <TabsTrigger value="turns" className="flex-1 sm:flex-none">📋 回合日志</TabsTrigger>
            </TabsList>
          </div>
          {/* ── Overview tab ── */}
          <TabsContent value="overview" className="flex-1 overflow-y-auto px-4 pb-6 pt-4 space-y-4 data-[state=inactive]:hidden">
            <ErrorBoundary>
              {/* Score breakdown */}
              <div className="rounded-lg border border-border bg-card/50 p-4 space-y-3">
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary">{totalScore}</div>
                  <div className="text-sm text-muted-foreground mt-1">综合得分（满分 100）</div>
                  {(agg + con) > 0 && (
                    <div className={`inline-block mt-2 px-3 py-0.5 rounded-full border text-xs font-medium ${bias.color}`}>
                      {bias.label}
                    </div>
                  )}
                </div>
                {/* Multiplicative formula */}
                <div className="flex items-center justify-center gap-2 text-sm flex-wrap pt-1">
                  <div className="text-center px-3 py-1.5 rounded bg-primary/10 border border-primary/30">
                    <div className="text-xs text-muted-foreground mb-0.5">转化率</div>
                    <div className="font-mono font-semibold text-primary">
                      {convertedCount}/{totalPeople}
                      <span className="text-xs ml-1 opacity-70">
                        = {totalPeople > 0 ? Math.round(convertedCount / totalPeople * 100) : 0}%
                      </span>
                    </div>
                  </div>
                  <span className="text-muted-foreground text-lg">×</span>
                  <div className="text-center px-3 py-1.5 rounded bg-green-500/10 border border-green-500/30">
                    <div className="text-xs text-muted-foreground mb-0.5">健康度指数</div>
                    <div className="font-mono font-semibold text-green-400">
                      {healthScore}%
                      <span className="text-xs ml-1 opacity-70">
                        (可信{finalCred}−压{finalPressure})
                      </span>
                    </div>
                  </div>
                  <span className="text-muted-foreground text-lg">×</span>
                  <div className="text-center px-3 py-1.5 rounded bg-muted/30 border border-border">
                    <div className="text-xs text-muted-foreground mb-0.5">满分</div>
                    <div className="font-mono font-semibold text-foreground">100</div>
                  </div>
                </div>
              </div>
              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                {[
                  { label: "转化人数", value: `${convertedCount}/${totalPeople}` },
                  { label: "剩余资源", value: String(resourcesLeft) },
                  { label: "共用回合", value: String(totalRounds) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-muted/20 rounded-lg p-3 border border-border">
                    <div className="font-semibold text-base text-foreground">{value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
              {/* Hidden ties */}
              {result.hiddenTiesStats && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-400">
                    <span>🔗</span>
                    <span>信任网利用率</span>
                    <span className="ml-auto text-xs font-normal text-muted-foreground">
                      {result.hiddenTiesStats.discoveredCount}/{result.hiddenTiesStats.total} 条已发现
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                    <div className="rounded bg-amber-500/10 border border-amber-500/20 px-2 py-1.5">
                      <div className="font-semibold text-amber-300">{result.hiddenTiesStats.discoveredCount}</div>
                      <div className="text-muted-foreground">已发现</div>
                    </div>
                    <div className="rounded bg-green-500/10 border border-green-500/20 px-2 py-1.5">
                      <div className="font-semibold text-green-400">{result.hiddenTiesStats.activatedCount}</div>
                      <div className="text-muted-foreground">已激活</div>
                    </div>
                    <div className="rounded bg-red-500/10 border border-red-500/20 px-2 py-1.5">
                      <div className="font-semibold text-red-400">{result.hiddenTiesStats.missedCount}</div>
                      <div className="text-muted-foreground">错失路径</div>
                    </div>
                  </div>
                  {result.hiddenTiesStats.activatedPairs?.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      <span className="text-green-400 font-medium">已激活：</span>
                      {result.hiddenTiesStats.activatedPairs.join("、")}
                    </div>
                  )}
                  {result.hiddenTiesStats.missedPairs?.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      <span className="text-red-400 font-medium">错失：</span>
                      {result.hiddenTiesStats.missedPairs.join("、")}
                    </div>
                  )}
                </div>
              )}
              {/* CTA buttons */}
              <div className="flex gap-2 pt-1">
                <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={onRestart}>
                  <RotateCcw className="w-4 h-4 mr-1.5" />
                  再测一局
                </Button>
                <Link href="/history" className="flex-1">
                  <Button variant="outline" className="w-full gap-1.5 bg-card">
                    我的记录
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </ErrorBoundary>
          </TabsContent>
          {/* ── Leaderboard tab ── */}
          <TabsContent value="leaderboard" className="flex-1 overflow-y-auto px-4 pb-6 pt-4 data-[state=inactive]:hidden">
            <ErrorBoundary>
              <LeaderboardPanel playerName={playerName} currentSessionId={sessionId} />
            </ErrorBoundary>
          </TabsContent>
          {/* ── Turn log tab ── */}
          <TabsContent value="turns" className="flex-1 overflow-y-auto px-4 pb-6 pt-4 data-[state=inactive]:hidden">
            <ErrorBoundary>
              <TurnLog sessionId={sessionId} />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function GameTestPage() {
  const { playerName, setPlayerName } = usePlayerName();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Always start with null — never restore from localStorage to avoid stale session bugs
  const [sessionId, setSessionIdState] = useState<number | null>(null);
  const setSessionId = useCallback((id: number | null) => {
    setSessionIdState(id);
    try { id != null ? localStorage.setItem(SESSION_ID_KEY, String(id)) : localStorage.removeItem(SESSION_ID_KEY); } catch {}
  }, []);

  // Freeze the sessionId at the moment GAME_ENDED fires so PostGameSummary always
  // shows the correct session even if the parent sessionId state changes later.
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [frozenSessionId, setFrozenSessionId] = useState<number | null>(null);

  const [iframeKey, setIframeKey] = useState(0);
  const [gameReady, setGameReady] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [cheatSent, setCheatSent] = useState(false);

  const sessionIdRef = useRef<number | null>(null);
  const addLog = useCallback((msg: string, ok: boolean) => {
    const ts = new Date().toLocaleTimeString("zh-CN");
    setLog(prev => [{ ts, msg, ok }, ...prev.slice(0, 29)]);
  }, []);

  const startSession = trpc.game.startSession.useMutation();
  const saveTurnMutation = trpc.game.saveTurn.useMutation();
  const endSession = trpc.game.endSession.useMutation();
  const utils = trpc.useUtils();

  // Use stable refs for async callbacks to avoid stale closures
  const endSessionRef = useRef(endSession.mutateAsync);
  const saveTurnRef = useRef(saveTurnMutation.mutateAsync);
  const utilsRef = useRef(utils);
  useEffect(() => { endSessionRef.current = endSession.mutateAsync; });
  useEffect(() => { saveTurnRef.current = saveTurnMutation.mutateAsync; });
  useEffect(() => { utilsRef.current = utils; });

  const testPlayerName = playerName || "测试玩家";

  const handleStartGame = useCallback(async () => {
    try {
      addLog("调用 startSession…", true);
      const session = await startSession.mutateAsync({ playerName: testPlayerName });
      const newId = session.sessionId;
      setSessionId(newId);
      sessionIdRef.current = newId;
      setGameResult(null);
      setFrozenSessionId(null);
      setGameReady(false);
      setCheatSent(false);
      setIframeKey(k => k + 1);
      addLog(`✅ startSession OK → sessionId=${newId}`, true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addLog(`❌ startSession FAILED: ${msg}`, false);
      toast.error("创建会话失败：" + msg);
    }
  }, [testPlayerName, startSession, setSessionId, addLog]);

  const handleIframeLoad = useCallback(() => {
    if (!iframeRef.current) return;
    const win = iframeRef.current.contentWindow;
    if (!win) return;
    win.postMessage({ type: "SET_PLAYER", name: testPlayerName }, "*");
    win.postMessage({ type: "SKIP_INTRO" }, "*");
    addLog("iframe loaded → SET_PLAYER + SKIP_INTRO sent", true);
  }, [testPlayerName, addLog]);

  const sendCheatWin = () => {
    if (!iframeRef.current?.contentWindow) {
      addLog("❌ iframe not ready", false);
      return;
    }
    iframeRef.current.contentWindow.postMessage({ type: "CHEAT_WIN" }, "*");
    setCheatSent(true);
    addLog("⚡ CHEAT_WIN sent to engine", true);
  };

  const sendSetResources = () => {
    if (!iframeRef.current?.contentWindow) {
      addLog("❌ iframe not ready", false);
      return;
    }
    iframeRef.current.contentWindow.postMessage({ type: "SET_RESOURCES", value: 2 }, "*");
    addLog("💰 SET_RESOURCES=2 sent to engine", true);
  };

  // Stable message handler — uses refs for all async dependencies
  const handleMessage = useCallback(async (event: MessageEvent) => {
    if (!event.data?.type) return;
    if (event.data.type === "GAME_READY") {
      setGameReady(true);
      addLog("✅ GAME_READY received", true);
      return;
    }
    const sid = sessionIdRef.current;
    if (event.data.type === "GAME_TURN" && sid !== null) {
      const turn = event.data.turn as TurnData;
      try {
        await saveTurnRef.current({
          sessionId: sid,
          round: turn.round,
          actionId: turn.actionId,
          actionLabel: turn.actionLabel,
          targets: turn.targets,
          prediction: turn.prediction,
          credibilityAfter: turn.credAfter,
          pressureAfter: turn.pressureAfter,
          resourcesAfter: turn.weeksLeft,
          outcome: turn.deltas.converted > 0 ? "success" : "partial",
        });
        addLog(`✅ GAME_TURN R${turn.round} saved`, true);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        addLog(`❌ saveTurn R${turn.round} FAILED: ${msg}`, false);
      }
    }
    if (event.data.type === "GAME_ENDED") {
      const result = event.data.result as GameResult;
      addLog(`📨 GAME_ENDED received — score=${result.totalScore}, converted=${result.convertedCount}/${result.totalPeople}`, true);
      // Freeze the sessionId at this exact moment so PostGameSummary always
      // receives the correct session even after state updates
      const currentSid = sessionIdRef.current;
      setFrozenSessionId(currentSid);
      setGameResult(result);
      if (currentSid !== null) {
        try {
          await endSessionRef.current({
            sessionId: currentSid,
            status: result.won ? "win" : "fail",
            resourcesLeft: Number(result.resourcesLeft) || 0,
            finalCredibility: Number(result.finalCred) || 0,
            finalPressure: Number(result.finalPressure) || 0,
            convertedCount: Number(result.convertedCount) || 0,
            totalRounds: Number(result.totalRounds) || 0,
            totalScore: Number(result.totalScore) || 0,
            baseScore: Number(result.baseScore) || 0,
            healthScore: Number(result.healthScore) || 0,
            aggressiveIndex: Number(result.aggressiveIndex) || 0,
            conservativeIndex: Number(result.conservativeIndex) || 0,
          });
          // Invalidate after endSession so TurnLog refetches with finalized data
          await utilsRef.current.game.getSession.invalidate({ sessionId: currentSid });
          await utilsRef.current.leaderboard.list.invalidate();
          addLog(`✅ endSession OK → score=${result.totalScore} saved to DB`, true);
          toast.success(`✅ 测试完成！得分 ${result.totalScore}，记录已保存`);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          addLog(`❌ endSession FAILED: ${msg}`, false);
          toast.error("endSession 失败：" + msg);
        }
      } else {
        addLog("⚠️ GAME_ENDED but sessionId is null — not saved", false);
      }
    }
  }, [addLog]); // Only depends on addLog (stable) — all other deps via refs

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
        <div className="text-lg font-bold text-primary">🧪 隐藏测试页</div>
        <Badge variant="outline" className="text-xs text-amber-400 border-amber-500/30 bg-amber-500/10">
          仅供内部测试
        </Badge>
        <div className="ml-auto text-xs text-muted-foreground">
          /game-test — 不在导航中显示
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: game iframe */}
        <div className="flex flex-col flex-1 min-w-0 p-4 gap-3 relative">
          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <input
              className="flex-1 min-w-[140px] px-3 py-1.5 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground"
              placeholder="测试玩家名"
              defaultValue={testPlayerName}
              onBlur={e => { if (e.target.value) setPlayerName(e.target.value); }}
            />
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 gap-1.5"
              onClick={handleStartGame}
              disabled={startSession.isPending}
            >
              {startSession.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              {sessionId ? "重置游戏" : "开始游戏"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
              onClick={sendCheatWin}
              disabled={!gameReady || cheatSent}
            >
              <Zap className="w-3.5 h-3.5" />
              ⚡ 一键全转化
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
              onClick={sendSetResources}
              disabled={!gameReady}
            >
              💰 资源→2
            </Button>
          </div>

          {/* Status badges */}
          <div className="flex items-center gap-2 flex-wrap text-xs shrink-0">
            <span className="text-muted-foreground">会话：</span>
            {sessionId != null
              ? <Badge variant="outline" className="text-green-400 border-green-500/30 bg-green-500/10">#{sessionId}</Badge>
              : <Badge variant="outline" className="text-muted-foreground">未创建</Badge>}
            <span className="text-muted-foreground ml-2">引擎：</span>
            {gameReady
              ? <Badge variant="outline" className="text-green-400 border-green-500/30 bg-green-500/10">就绪</Badge>
              : <Badge variant="outline" className="text-muted-foreground">等待中</Badge>}
            {gameResult && (
              <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10">
                <Trophy className="w-3 h-3 mr-1" />
                {gameResult.totalScore} 分
              </Badge>
            )}
          </div>

          {/* iframe — always show placeholder until 'Start Game' is clicked */}
          {sessionId !== null ? (
            <div className="flex-1 rounded-xl border border-border overflow-hidden bg-card">
              <iframe
                key={iframeKey}
                ref={iframeRef}
                src={GAME_ENGINE_URL}
                className="w-full h-full"
                onLoad={handleIframeLoad}
                sandbox="allow-scripts allow-forms allow-popups allow-downloads"
                title="game-engine-test"
              />
            </div>
          ) : (
            <div className="flex-1 rounded-xl border border-dashed border-border flex flex-col items-center justify-center gap-3 text-muted-foreground text-sm">
              <div className="text-3xl">🎮</div>
              <div>点击「开始游戏」创建会话并加载引擎</div>
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 gap-1.5 mt-1"
                onClick={handleStartGame}
                disabled={startSession.isPending}
              >
                {startSession.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                开始游戏
              </Button>
            </div>
          )}

          {/* PostGameSummary overlay — uses frozenSessionId to avoid race conditions */}
          {gameResult && (
            <ErrorBoundary
              fallback={
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background px-4">
                  <Trophy className="w-12 h-12 text-primary" />
                  <div className="text-xl font-bold text-foreground">游戏结束！</div>
                  <div className="text-4xl font-bold text-primary">{Number(gameResult.totalScore) || 0} 分</div>
                  <Button className="mt-4 bg-primary hover:bg-primary/90" onClick={handleStartGame}>
                    <RotateCcw className="w-4 h-4 mr-1.5" />
                    再测一局
                  </Button>
                </div>
              }
            >
              <PostGameSummary
                result={gameResult}
                sessionId={frozenSessionId}
                playerName={testPlayerName}
                onClose={() => setGameResult(null)}
              onRestart={() => {
                  setGameResult(null);
                  setFrozenSessionId(null);
                  handleStartGame();
                }}
              />
            </ErrorBoundary>
          )}
        </div>

        {/* Right: event log */}
        <div className="w-80 shrink-0 flex flex-col border-l border-border p-4 gap-3 overflow-hidden">
          <div className="text-sm font-semibold text-foreground shrink-0">📋 事件日志</div>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-1">
            {log.length === 0 && (
              <div className="text-muted-foreground text-sm py-4 text-center">等待事件…</div>
            )}
            {log.map((entry, i) => (
              <div key={i} className="flex items-start gap-2 text-xs font-mono rounded px-2 py-1 bg-card/50 border border-border">
                {entry.ok
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                  : <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />}
                <span className="text-muted-foreground shrink-0">{entry.ts}</span>
                <span className={entry.ok ? "text-foreground" : "text-red-400"}>{entry.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
