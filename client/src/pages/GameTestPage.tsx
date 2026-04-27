/**
 * HIDDEN TEST PAGE — /game-test
 * Not linked in navigation. For rapid QA testing only.
 *
 * Features:
 *  - "⚡ 一键全转化" button: sends CHEAT_WIN to the engine iframe → all 12 people
 *    instantly converted → game ends → full-screen result page shows.
 *  - "💰 资源→2" button: sends SET_RESOURCES=2 to the engine → fast game end.
 *  - "🔁 重置游戏" button: restarts the session (same as the normal restart flow).
 *  - Shows live DB status: whether startSession / endSession succeeded.
 *  - Plan A: after game ends, React full-screen result page REPLACES the iframe.
 *    One unified page: ending narrative + 本局总览 + 排行榜 + 回合日志.
 */
import React, { useRef, useState, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trophy, RotateCcw, Zap, CheckCircle2, XCircle, Loader2, ChevronRight, BookOpen, Users, List } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { usePlayerName } from "@/hooks/usePlayerName";

const GAME_ENGINE_URL = "/manus-storage/game-engine_ca0c5ad1.html?autoStart=1";
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

interface EndingNarrative {
  cls: string;
  title: string;
  story: string;
  teach: string;
  realWorld: string;
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
  narrative?: EndingNarrative | null;
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
    return <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin" />加载中…</div>;
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

// ─── Full-screen Result Page (Plan A) ─────────────────────────────────────────
function FullResultPage({
  result,
  sessionId,
  playerName,
  onRestart,
}: {
  result: GameResult;
  sessionId: number | null;
  playerName: string;
  onRestart: () => void;
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
  const narrative = result.narrative;

  // Determine color scheme from ending type
  const isWin = result.won;
  const accentClass = isWin ? "text-green-400" : "text-red-400";
  const accentBorder = isWin ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5";

  const stats = [
    { label: "综合得分", value: `${totalScore}`, highlight: true },
    { label: "已转化", value: `${convertedCount}/${totalPeople}` },
    { label: "剩余资源", value: `${resourcesLeft}` },
    { label: "总回合", value: `${totalRounds}` },
    { label: "最终可信度", value: `${finalCred}` },
    { label: "最终压力", value: `${finalPressure}` },
    { label: "健康指数", value: `${healthScore}` },
  ];

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* ── Top header bar ── */}
      <div className={`shrink-0 px-6 py-4 border-b border-border flex items-center gap-4 ${isWin ? "bg-green-500/5" : "bg-red-500/5"}`}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Trophy className={`w-6 h-6 shrink-0 ${accentClass}`} />
          <div className="min-w-0">
            <div className={`text-lg font-bold ${accentClass} leading-tight`}>
              {narrative?.title ?? (isWin ? "游戏结束 · 变革成功" : "游戏结束 · 复盘时刻")}
            </div>
            <div className="text-xs text-muted-foreground">{playerName} · 测试模式</div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-3xl font-bold text-primary leading-none">{totalScore}</div>
            <div className="text-xs text-muted-foreground">综合得分</div>
          </div>
          <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90" onClick={onRestart}>
            <RotateCcw className="w-3.5 h-3.5" />
            再测一局
          </Button>
          <Link href="/history">
            <Button size="sm" variant="outline" className="gap-1 bg-card">
              我的记录 <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Main content: tabs ── */}
      <Tabs defaultValue="narrative" className="flex flex-col flex-1 min-h-0">
        <TabsList className="shrink-0 mx-6 mt-4 mb-0 w-auto self-start gap-1 bg-muted/40">
          <TabsTrigger value="narrative" className="gap-1.5 text-xs">
            <BookOpen className="w-3.5 h-3.5" />
            结局复盘
          </TabsTrigger>
          <TabsTrigger value="overview" className="gap-1.5 text-xs">
            <Trophy className="w-3.5 h-3.5" />
            本局总览
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="gap-1.5 text-xs">
            <Users className="w-3.5 h-3.5" />
            排行榜
          </TabsTrigger>
          <TabsTrigger value="turns" className="gap-1.5 text-xs">
            <List className="w-3.5 h-3.5" />
            回合日志
          </TabsTrigger>
        </TabsList>

        {/* ── 结局复盘 tab ── */}
        <TabsContent value="narrative" className="flex-1 overflow-y-auto px-6 pb-6 pt-4 data-[state=inactive]:hidden">
          {narrative ? (
            <div className="max-w-2xl space-y-5">
              {/* Story */}
              <div className={`rounded-xl border p-5 ${accentBorder}`}>
                <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${accentClass}`}>结局故事</div>
                <p className="text-sm text-foreground leading-relaxed">{narrative.story}</p>
              </div>
              {/* Teaching points */}
              <div className="rounded-xl border border-border bg-card/40 p-5">
                <div className="text-xs font-semibold uppercase tracking-wider mb-3 text-primary">📚 教学要点</div>
                <div className="space-y-2">
                  {narrative.teach.split("\n").filter(Boolean).map((line, i) => (
                    <p key={i} className="text-sm text-foreground leading-relaxed">{line}</p>
                  ))}
                </div>
              </div>
              {/* Real-world cases */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
                <div className="text-xs font-semibold uppercase tracking-wider mb-3 text-amber-400">🌍 真实案例参照</div>
                <div className="space-y-2">
                  {narrative.realWorld.split("\n").filter(Boolean).map((line, i) => (
                    <p key={i} className="text-sm text-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: line }} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
              暂无结局叙事数据
            </div>
          )}
        </TabsContent>

        {/* ── 本局总览 tab ── */}
        <TabsContent value="overview" className="flex-1 overflow-y-auto px-6 pb-6 pt-4 data-[state=inactive]:hidden">
          <ErrorBoundary>
            <div className="max-w-2xl space-y-5">
              {/* Score formula */}
              <div className="rounded-xl border border-border bg-card/40 p-4">
                <div className="text-xs font-semibold text-muted-foreground mb-3">得分公式</div>
                <div className="text-xs font-mono text-muted-foreground space-y-1">
                  <div>转化率 = {convertedCount}/{totalPeople} = {Math.round(convertedCount/totalPeople*100)}%</div>
                  <div>健康指数 = (max(0, {finalCred}−{finalPressure}) + 10) / 20 = {(healthScore/100).toFixed(2)}</div>
                  <div className="text-primary font-semibold">综合得分 = {Math.round(convertedCount/totalPeople*100)}% × {(healthScore/100).toFixed(2)} × 100 = <span className="text-lg">{totalScore}</span></div>
                </div>
              </div>
              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stats.map(({ label, value, highlight }) => (
                  <div key={label} className={`rounded-lg border p-3 text-center ${highlight ? "border-primary/40 bg-primary/5" : "border-border bg-card/30"}`}>
                    <div className={`font-bold text-lg leading-none mb-1 ${highlight ? "text-primary" : "text-foreground"}`}>{value}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                ))}
                {/* Strategy bias */}
                <div className={`rounded-lg border p-3 text-center ${bias.color}`}>
                  <div className="font-semibold text-sm leading-none mb-1">{bias.label}</div>
                  <div className="text-xs text-muted-foreground">策略风格</div>
                </div>
              </div>
              {/* Hidden ties */}
              {result.hiddenTiesStats && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
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
            </div>
          </ErrorBoundary>
        </TabsContent>

        {/* ── Leaderboard tab ── */}
        <TabsContent value="leaderboard" className="flex-1 overflow-y-auto px-6 pb-6 pt-4 data-[state=inactive]:hidden">
          <ErrorBoundary>
            <div className="max-w-2xl">
              <LeaderboardPanel playerName={playerName} currentSessionId={sessionId} />
            </div>
          </ErrorBoundary>
        </TabsContent>

        {/* ── Turn log tab ── */}
        <TabsContent value="turns" className="flex-1 overflow-y-auto px-6 pb-6 pt-4 data-[state=inactive]:hidden">
          <ErrorBoundary>
            <div className="max-w-2xl">
              <TurnLog sessionId={sessionId} />
            </div>
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
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
  // Plan A: freeze sessionId + result at GAME_ENDED moment, then replace iframe with FullResultPage
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [frozenSessionId, setFrozenSessionId] = useState<number | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [gameReady, setGameReady] = useState(false);
  const [cheatSent, setCheatSent] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);

  const addLog = useCallback((msg: string, ok: boolean) => {
    const ts = new Date().toLocaleTimeString("zh-CN", { hour12: false });
    setLog(prev => [...prev.slice(-99), { ts, msg, ok }]);
  }, []);

  const testPlayerName = playerName || "测试玩家";

  // tRPC mutations
  const startSession = trpc.game.startSession.useMutation();
  const endSession = trpc.game.endSession.useMutation();
  const saveTurn = trpc.game.saveTurn.useMutation();
  const utils = trpc.useUtils();

  // Stable refs for async handlers
  const sessionIdRef = useRef<number | null>(null);
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
  const endSessionRef = useRef(endSession.mutateAsync);
  useEffect(() => { endSessionRef.current = endSession.mutateAsync; }, [endSession.mutateAsync]);
  const saveTurnRef = useRef(saveTurn.mutateAsync);
  useEffect(() => { saveTurnRef.current = saveTurn.mutateAsync; }, [saveTurn.mutateAsync]);
  const utilsRef = useRef(utils);
  useEffect(() => { utilsRef.current = utils; }, [utils]);

  const handleStartGame = useCallback(async () => {
    // Reset result state for new game
    setGameResult(null);
    setFrozenSessionId(null);
    setGameReady(false);
    setCheatSent(false);
    setLog([]);
    try {
      const res = await startSession.mutateAsync({ playerName: testPlayerName });
      const newId = res.sessionId;
      setSessionId(newId);
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
      // Freeze sessionId at this exact moment
      const currentSid = sessionIdRef.current;
      setFrozenSessionId(currentSid);
      // Set result AFTER endSession so data is in DB when FullResultPage queries
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
          await utilsRef.current.game.getSession.invalidate({ sessionId: currentSid });
          await utilsRef.current.leaderboard.list.invalidate();
          addLog(`✅ endSession OK → score=${result.totalScore} saved to DB`, true);
          toast.success(`✅ 测试完成！得分 ${result.totalScore}`);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          addLog(`❌ endSession FAILED: ${msg}`, false);
          toast.error("endSession 失败：" + msg);
        }
      } else {
        addLog("⚠️ GAME_ENDED but sessionId is null — not saved", false);
      }
      // Show full-screen result page (Plan A) — replaces iframe
      setGameResult(result);
    }
  }, [addLog]);

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden bg-background">
      {/* ── Left: game area (iframe OR full-screen result) ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Control bar — always visible */}
        <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b border-border bg-card/60 flex-wrap">
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors mr-1">← 返回首页</Link>
          <Badge variant="outline" className="text-xs text-amber-400 border-amber-500/30">🧪 测试模式</Badge>
          <div className="flex-1" />
          <input
            className="h-7 text-xs rounded border border-border bg-background px-2 w-28 text-foreground placeholder:text-muted-foreground"
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
            disabled={!gameReady || cheatSent || gameResult != null}
          >
            <Zap className="w-3.5 h-3.5" />
            ⚡ 一键全转化
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
            onClick={sendSetResources}
            disabled={!gameReady || gameResult != null}
          >
            💰 资源→2
          </Button>
        </div>

        {/* Status bar */}
        <div className="shrink-0 flex items-center gap-2 px-4 py-1.5 border-b border-border bg-background/50 flex-wrap text-xs">
          <span className="text-muted-foreground">会话：</span>
          {sessionId != null
            ? <Badge variant="outline" className="text-green-400 border-green-500/30 bg-green-500/10">#{sessionId}</Badge>
            : <Badge variant="outline" className="text-muted-foreground">未创建</Badge>}
          <span className="text-muted-foreground ml-2">引擎：</span>
          {gameResult != null
            ? <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10">结算中</Badge>
            : gameReady
            ? <Badge variant="outline" className="text-green-400 border-green-500/30 bg-green-500/10">就绪</Badge>
            : <Badge variant="outline" className="text-muted-foreground">等待中</Badge>}
          {gameResult && (
            <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10">
              <Trophy className="w-3 h-3 mr-1" />
              {gameResult.totalScore} 分
            </Badge>
          )}
        </div>

        {/* Main area: iframe OR full-screen result */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {/* Plan A: show FullResultPage when game ends, otherwise show iframe */}
          {gameResult != null ? (
            <FullResultPage
              result={gameResult}
              sessionId={frozenSessionId}
              playerName={playerName}
              onRestart={handleStartGame}
            />
          ) : sessionId !== null ? (
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={GAME_ENGINE_URL}
              className="w-full h-full"
              onLoad={handleIframeLoad}
              sandbox="allow-scripts allow-forms allow-popups allow-downloads"
              title="game-engine-test"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground text-sm">
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
        </div>
      </div>

      {/* ── Right: event log ── */}
      <div className="w-72 shrink-0 flex flex-col border-l border-border p-4 gap-3 overflow-hidden">
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
  );
}
