import React, { useState, useRef, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trophy, RotateCcw, UserRound, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { usePlayerName } from "@/hooks/usePlayerName";

const GAME_ENGINE_URL = "/manus-storage/game-engine_51b31f2a.html?autoStart=1";
const SESSION_ID_KEY = "china-outbound-session-id";

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
  // Guard: never call tRPC with null sessionId
  const { data, isLoading } = trpc.game.getSession.useQuery(
    { sessionId: sessionId! },
    { enabled: sessionId != null }
  );

  if (sessionId == null) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        无会话记录
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        加载回合日志…
      </div>
    );
  }
  const turns = data?.turns ?? [];
  if (turns.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        暂无回合记录
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {turns.map((t, idx) => {
        // Compute deltas vs previous turn (or initial values for round 1)
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
              <span className="text-muted-foreground">
                资源 → {t.resourcesAfter ?? "-"}
              </span>
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
  const { data: statsData } = trpc.leaderboard.stats.useQuery();
  const rows = listData ?? [];
  const stats = statsData;

  const [compareIds, setCompareIds] = useState<number[]>([]);
  const toggleCompare = (id: number) => {
    setCompareIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 2 ? [...prev, id] : [prev[1], id]
    );
  };

  return (
    <div className="space-y-4">
      {/* Global stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          {[
            { label: "完成局数", value: String((stats as any)?.count ?? 0) },
            { label: "平均得分", value: (stats as any)?.avgTotal?.toFixed(1) ?? "-" },
            { label: "平均健康度", value: (stats as any)?.avgHealth?.toFixed(1) ?? "-" },
            { label: "平均效率分", value: `+${(stats as any)?.avgEfficiency?.toFixed(1) ?? "-"}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-muted/20 rounded-lg p-2 border border-border">
              <div className="font-semibold text-sm">{value}</div>
              <div className="text-muted-foreground mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {compareIds.length === 2 && (() => {
        const a = rows.find((r: (typeof rows)[0]) => r.id === compareIds[0]);
        const b = rows.find((r: (typeof rows)[0]) => r.id === compareIds[1]);
        if (!a || !b) return null;
        return (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs space-y-1">
            <div className="font-semibold text-primary mb-2 flex items-center gap-1.5">
              <span>🔍</span> 对比分析
              <button className="ml-auto text-muted-foreground hover:text-foreground" onClick={() => setCompareIds([])}>✕</button>
            </div>
            {[
              { label: "得分", va: a.totalScore, vb: b.totalScore },
              { label: "转化", va: `${a.convertedCount}/12`, vb: `${b.convertedCount}/12` },
              { label: "可信度", va: a.finalCredibility, vb: b.finalCredibility },
              { label: "压力", va: a.finalPressure, vb: b.finalPressure },
            ].map(({ label, va, vb }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-muted-foreground w-10">{label}</span>
                <span className="flex-1 text-right font-mono">{va}</span>
                <span className="text-muted-foreground">vs</span>
                <span className="flex-1 font-mono">{vb}</span>
              </div>
            ))}
          </div>
        );
      })()}

      {compareIds.length > 0 && compareIds.length < 2 && (
        <div className="text-xs text-muted-foreground text-center py-1">
          💡 点击任意信息栏进行决策对比（已选 {compareIds.length}/2）
        </div>
      )}

      {/* Rows */}
      <div className="space-y-1.5">
        {rows.map((row: (typeof rows)[0], i: number) => {
          const isMe = !!playerName && row.playerName === playerName;
          const isCurrent = row.id === currentSessionId;
          const isSelected = compareIds.includes(row.id);
          return (
            <div
              key={row.id}
              className={`rounded-lg border p-2.5 cursor-pointer transition-colors ${
                isCurrent
                  ? "border-primary/50 bg-primary/10"
                  : isSelected
                  ? "border-primary/30 bg-primary/5"
                  : isMe
                  ? "border-border bg-muted/30"
                  : "border-border bg-card/30 hover:bg-muted/20"
              }`}
              onClick={() => toggleCompare(row.id)}
            >
              <div className="flex items-center gap-2">
                <RankBadge rank={i + 1} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-medium">{row.playerName ?? "匿名"}</span>
                    {isCurrent && <Badge variant="outline" className="text-[10px] px-1 py-0 border-primary/50 text-primary shrink-0">本局</Badge>}
                    {isSelected && <Badge variant="outline" className="text-[10px] px-1 py-0 border-primary/50 text-primary shrink-0">✓</Badge>}
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
                {row.aggressiveIndex != null && row.conservativeIndex != null && (
                  <span className={strategyBias(row.aggressiveIndex, row.conservativeIndex).color}>
                    {strategyBias(row.aggressiveIndex, row.conservativeIndex).label}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Post-game summary overlay ────────────────────────────────────────────────
function PostGameSummary({
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
  // Defensive: ensure all numeric fields are numbers
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
            <div className="text-xs text-muted-foreground">{playerName}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right mr-1">
            <div className="text-2xl font-bold text-primary leading-none">{totalScore}</div>
            <div className="text-xs text-muted-foreground">综合得分</div>
          </div>
          <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90" onClick={onRestart}>
            <RotateCcw className="w-3.5 h-3.5" />
            再玩一局
          </Button>
        </div>
      </div>

      {/* Tabs — flex-1 so they fill remaining height */}
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
                  再玩一局
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

// ─── Main GamePage ─────────────────────────────────────────────────────────────
export default function GamePage() {
  const { playerName } = usePlayerName();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [gameReady, setGameReady] = useState<boolean | null>(null);

  // Persist sessionId in both state and localStorage so it survives re-renders
  const [sessionId, setSessionIdState] = useState<number | null>(() => {
    try {
      const stored = localStorage.getItem(SESSION_ID_KEY);
      return stored ? Number(stored) : null;
    } catch {
      return null;
    }
  });
  const setSessionId = useCallback((id: number | null) => {
    setSessionIdState(id);
    try {
      if (id != null) {
        localStorage.setItem(SESSION_ID_KEY, String(id));
      } else {
        localStorage.removeItem(SESSION_ID_KEY);
      }
    } catch {
      // ignore
    }
  }, []);

  const startSession = trpc.game.startSession.useMutation();
  const saveTurnMutation = trpc.game.saveTurn.useMutation();
  const endSession = trpc.game.endSession.useMutation();
  const utils = trpc.useUtils();

  const sessionIdRef = useRef<number | null>(sessionId);
  const endSessionRef = useRef(endSession.mutateAsync);
  const saveTurnRef = useRef(saveTurnMutation.mutateAsync);
  useEffect(() => { endSessionRef.current = endSession.mutateAsync; });
  useEffect(() => { saveTurnRef.current = saveTurnMutation.mutateAsync; });

  const handleIframeLoad = () => {
    if (!iframeRef.current || !playerName) return;
    const win = iframeRef.current.contentWindow;
    if (!win) return;
    win.postMessage({ type: "SET_PLAYER", name: playerName }, "*");
    win.postMessage({ type: "SKIP_INTRO" }, "*");
  };

  const handleStartGame = useCallback(async (name?: string) => {
    const activeName = name ?? playerName;
    if (!activeName) return;
    try {
      const session = await startSession.mutateAsync({ playerName: activeName });
      const newId = session.sessionId;
      setSessionId(newId);
      sessionIdRef.current = newId;
      setGameResult(null);
      setGameReady(false);
      setIframeKey(k => k + 1);
      await new Promise(r => setTimeout(r, 50));
    } catch {
      toast.error("无法创建游戏会话，请重试");
    }
  }, [playerName, startSession, setSessionId]);

  const handleMessage = useCallback(async (event: MessageEvent) => {
    if (!event.data?.type) return;
    if (event.data.type === "GAME_READY") {
      setGameReady(true);
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
      } catch {
        // Non-blocking
      }
    }
    if (event.data.type === "GAME_ENDED") {
      const result = event.data.result as GameResult;
      // Set gameResult immediately so the overlay renders
      setGameResult(result);
      // Only save to DB if we have a valid session
      if (sid !== null) {
        try {
          await endSessionRef.current({
            sessionId: sid,
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
          // Invalidate queries so TurnLog and leaderboard show fresh data
          await utils.game.getSession.invalidate({ sessionId: sid });
          await utils.leaderboard.list.invalidate();
          toast.success(`🎮 游戏结束！综合得分 ${Number(result.totalScore) || 0} 分，记录已保存`);
        } catch (err) {
          console.error("[endSession] failed:", err);
          toast.error("保存游戏记录失败，请截图联系管理员");
        }
      }
    }
  }, [utils]);

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  if (!playerName) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] gap-4 px-4">
        <p className="text-muted-foreground">请先在首页输入你的名字</p>
        <Link href="/">
          <Button className="bg-primary hover:bg-primary/90">返回首页</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] relative">
      {/* Game toolbar — only shown while game is active */}
      {!gameResult && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <UserRound className="w-3.5 h-3.5 text-primary" />
              {playerName}
            </span>
            {sessionId !== null && (
              <Badge variant="outline" className="text-xs text-primary border-primary/30">
                游戏进行中
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {sessionId === null ? (
              <Button
                size="sm"
                className="gap-1.5 bg-primary hover:bg-primary/90"
                onClick={() => handleStartGame()}
                disabled={startSession.isPending}
              >
                {startSession.isPending ? "创建中..." : "🚀 开始新游戏"}
              </Button>
            ) : (
              <Button size="sm" variant="outline" className="gap-1.5 bg-card" onClick={() => handleStartGame()}>
                <RotateCcw className="w-3.5 h-3.5" />
                重新开始
              </Button>
            )}
            <Link href="/leaderboard">
              <Button size="sm" variant="ghost" className="gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                排行榜
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Post-game summary overlay (full-page, tabbed) */}
      {gameResult && (
        <ErrorBoundary
          fallback={
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background px-4">
              <Trophy className="w-12 h-12 text-primary" />
              <div className="text-xl font-bold text-foreground">游戏结束！</div>
              <div className="text-4xl font-bold text-primary">{Number(gameResult.totalScore) || 0} 分</div>
              <div className="text-sm text-muted-foreground">转化 {Number(gameResult.convertedCount) || 0}/{Number(gameResult.totalPeople) || 12} 人</div>
              <Button className="mt-4 bg-primary hover:bg-primary/90" onClick={() => handleStartGame()}>
                <RotateCcw className="w-4 h-4 mr-1.5" />
                再玩一局
              </Button>
            </div>
          }
        >
          <PostGameSummary
            result={gameResult}
            sessionId={sessionId}
            playerName={playerName}
            onRestart={() => {
              setGameResult(null);
              setSessionId(null);
              sessionIdRef.current = null;
              handleStartGame();
            }}
          />
        </ErrorBoundary>
      )}

      {/* Game iframe or start prompt */}
      {sessionId !== null ? (
        <div className="flex-1 relative">
          {gameReady !== null && (
            <div
              className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 transition-opacity duration-500"
              style={{
                background: "var(--background)",
                opacity: gameReady ? 0 : 1,
                pointerEvents: gameReady ? "none" : "auto",
              }}
            >
              <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <p className="text-sm text-muted-foreground">正在加载游戏…</p>
            </div>
          )}
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={GAME_ENGINE_URL}
            className="w-full h-full border-none"
            onLoad={handleIframeLoad}
            title="中国企业出海变革模拟"
            sandbox="allow-scripts allow-forms allow-popups allow-downloads"
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🚀</div>
            <h2 className="text-2xl font-bold mb-2 text-foreground">准备出发，{playerName}</h2>
            <p className="text-muted-foreground mb-6">
              点击「开始新游戏」创建一局新的游戏记录。<br />
              游戏结束后，成绩将自动保存到排行榜。
            </p>
            <Button
              size="lg"
              className="gap-2 bg-primary hover:bg-primary/90"
              onClick={() => handleStartGame()}
              disabled={startSession.isPending}
            >
              {startSession.isPending ? "创建中..." : "🚀 开始新游戏"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
