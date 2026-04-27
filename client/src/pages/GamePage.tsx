import { useCallback, useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trophy, RotateCcw, UserRound, GitCompare, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { usePlayerName } from "@/hooks/usePlayerName";

const GAME_ENGINE_URL = "/manus-storage/game-engine_51b31f2a.html?autoStart=1";

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

// ─── Turn Log component ───────────────────────────────────────────────────────
function TurnLog({ sessionId }: { sessionId: number }) {
  const { data, isLoading } = trpc.game.getSession.useQuery({ sessionId });

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

        return (
          <div
            key={t.id}
            className="rounded-lg border border-border bg-card/50 px-4 py-3 space-y-2"
          >
            {/* Row 1: round + action + outcome chip */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs font-mono shrink-0 border-primary/30 text-primary">
                  R{t.round}
                </Badge>
                <span className="text-sm font-semibold">{t.actionLabel ?? t.actionId ?? "—"}</span>
                {targets.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    → {targets.join("、")}
                  </span>
                )}
              </div>
              <Badge
                className={`text-xs shrink-0 ${
                  t.outcome === "success"
                    ? "bg-green-500/15 text-green-400 border-green-500/30"
                    : "bg-muted/40 text-muted-foreground border-border"
                }`}
              >
                {t.outcome === "success" ? "✓ 转化" : "—"}
              </Badge>
            </div>

            {/* Row 2: deltas + after stats */}
            <div className="flex items-center gap-3 flex-wrap text-xs">
              {credDelta !== 0 && (
                <span className={`font-medium ${credDelta > 0 ? "text-primary" : "text-red-400"}`}>
                  可信 {credDelta > 0 ? "+" : ""}{credDelta}
                </span>
              )}
              {pressDelta !== 0 && (
                <span className={`font-medium ${pressDelta > 0 ? "text-red-400" : "text-green-400"}`}>
                  压力 {pressDelta > 0 ? "+" : ""}{pressDelta}
                </span>
              )}
              <span className="text-muted-foreground ml-auto">
                可信 <span className="text-foreground font-medium">{t.credibilityAfter}</span>
                {" · "}
                压力 <span className="text-foreground font-medium">{t.pressureAfter}</span>
                {" · "}
                剩余 <span className="text-foreground font-medium">{t.resourcesAfter}</span>
              </span>
            </div>

            {/* Row 3: prediction (if any) */}
            {t.prediction && (
              <div className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-2">
                预判：{t.prediction}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Leaderboard panel ────────────────────────────────────────────────────────
function LeaderboardPanel({ playerName, currentSessionId }: { playerName: string; currentSessionId: number | null }) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const { data: rows, isLoading } = trpc.leaderboard.list.useQuery({ limit: 50 });
  const { data: stats } = trpc.leaderboard.stats.useQuery();

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 2 ? [...prev, id] : [prev[1], id]
    );
  };

  return (
    <div className="space-y-4">
      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: "完成局数", value: stats.count },
            { label: "平均得分", value: stats.avgTotal.toFixed(1) },
            { label: "平均健康度", value: stats.avgHealth.toFixed(1) },
            { label: "平均效率分", value: `+${stats.avgEfficiency.toFixed(1)}` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg border border-border bg-card/50 p-3 text-center">
              <div className="text-base font-bold text-primary">{value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Compare hint + button */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          💡 点击任意两行可选中，然后进行决策对比（已选 {selectedIds.length}/2）
        </p>
        {selectedIds.length === 2 && (
          <Link href={`/compare/${selectedIds[0]}/${selectedIds[1]}`}>
            <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90 shrink-0">
              <GitCompare className="w-3.5 h-3.5" />
              对比两局
            </Button>
          </Link>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">加载中…</div>
        ) : !rows?.length ? (
          <div className="p-8 text-center text-muted-foreground text-sm">暂无记录</div>
        ) : (
          <div className="divide-y divide-border">
            {/* Desktop header */}
            <div className="hidden sm:grid grid-cols-[44px_1fr_72px_72px_72px_72px_80px] gap-2 px-4 py-2 text-xs text-muted-foreground font-medium bg-muted/10">
              <span>排名</span>
              <span>玩家</span>
              <span className="text-right">得分</span>
              <span className="text-right">转化</span>
              <span className="text-right">可信</span>
              <span className="text-right">压力</span>
              <span className="text-right">策略</span>
            </div>
            {rows.map(row => {
              const isMe = !!playerName && row.playerName === playerName;
              const isCurrent = row.id === currentSessionId;
              const isSelected = selectedIds.includes(row.id);
              const bias = strategyBias(row.aggressiveIndex ?? 0, row.conservativeIndex ?? 0);
              return (
                <div
                  key={row.id}
                  onClick={() => toggleSelect(row.id)}
                  className={`cursor-pointer transition-colors
                    ${isCurrent
                      ? "bg-primary/10 border-l-4 border-primary"
                      : isMe
                        ? "bg-yellow-400/8 border-l-4 border-yellow-400/60 hover:bg-yellow-400/12"
                        : isSelected
                          ? "bg-primary/8 border-l-2 border-primary/50"
                          : "hover:bg-muted/20"
                    }
                  `}
                >
                  {/* Desktop row */}
                  <div className="hidden sm:grid grid-cols-[44px_1fr_72px_72px_72px_72px_80px] gap-2 px-4 py-2.5 text-sm items-center">
                    <div className="flex items-center"><RankBadge rank={row.rank} /></div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="truncate font-medium">{row.playerName ?? "匿名"}</span>
                      {isCurrent && <Badge className="text-xs shrink-0 bg-primary/20 text-primary border-primary/30">本局</Badge>}
                      {isMe && !isCurrent && <Badge variant="outline" className="text-xs shrink-0 border-yellow-400/50 text-yellow-400">我</Badge>}
                    </div>
                    <div className="text-right font-bold text-primary">{Number(row.totalScore).toFixed(1)}</div>
                    <div className="text-right">{row.convertedCount ?? 0}/12</div>
                    <div className="text-right text-green-400">{row.finalCredibility ?? 0}</div>
                    <div className="text-right text-destructive">{row.finalPressure ?? 0}</div>
                    <div className={`text-right text-xs font-medium ${bias.color.split(" ")[0]}`}>{bias.label.replace(/^[^ ]+ /, "")}</div>
                  </div>
                  {/* Mobile row */}
                  <div className="sm:hidden px-4 py-3 flex items-center gap-3">
                    <div className="shrink-0 w-8 flex items-center justify-center">
                      <RankBadge rank={row.rank} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-sm truncate">{row.playerName ?? "匿名"}</span>
                        {isCurrent && <Badge className="text-xs bg-primary/20 text-primary border-primary/30 shrink-0">本局</Badge>}
                        {isMe && !isCurrent && <Badge variant="outline" className="text-xs border-yellow-400/50 text-yellow-400 shrink-0">我</Badge>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                        <span>转化 <span className="text-foreground">{row.convertedCount ?? 0}/12</span></span>
                        <span>可信 <span className="text-green-400">{row.finalCredibility ?? 0}</span></span>
                        <span>压力 <span className="text-destructive">{row.finalPressure ?? 0}</span></span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-bold text-primary">{Number(row.totalScore).toFixed(1)}</div>
                      <div className="text-xs text-muted-foreground">分</div>
                    </div>
                    {isSelected && (
                      <div className="shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground text-xs font-bold">✓</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Post-game summary (full-page overlay with tabs) ─────────────────────────
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
  const agg = result.aggressiveIndex ?? 0;
  const con = result.conservativeIndex ?? 0;
  const bias = strategyBias(agg, con);

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-background overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/60 shrink-0">
        <div className="flex items-center gap-3">
          <Trophy className="w-5 h-5 text-primary shrink-0" />
          <div>
            <div className="text-sm font-semibold">游戏结束 · 复盘时刻</div>
            <div className="text-xs text-muted-foreground">{playerName}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right mr-1">
            <div className="text-2xl font-bold text-primary leading-none">{result.totalScore}</div>
            <div className="text-xs text-muted-foreground">综合得分</div>
          </div>
          <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90" onClick={onRestart}>
            <RotateCcw className="w-3.5 h-3.5" />
            再玩一局
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="flex flex-col flex-1 min-h-0">
        <div className="px-4 pt-3 shrink-0">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="overview" className="flex-1 sm:flex-none">📊 本局总览</TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex-1 sm:flex-none">🏆 排行榜</TabsTrigger>
            <TabsTrigger value="turns" className="flex-1 sm:flex-none">📋 回合日志</TabsTrigger>
          </TabsList>
        </div>

        {/* ── Overview tab ── */}
        <TabsContent value="overview" className="flex-1 overflow-y-auto px-4 pb-6 pt-4 space-y-4">
          {/* Score breakdown */}
          <div className="rounded-lg border border-border bg-card/50 p-4 space-y-3">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary">{result.totalScore}</div>
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
                  {result.convertedCount}/{result.totalPeople}
                  <span className="text-xs ml-1 opacity-70">
                    = {Math.round(result.convertedCount / result.totalPeople * 100)}%
                  </span>
                </div>
              </div>
              <span className="text-muted-foreground text-lg">×</span>
              <div className="text-center px-3 py-1.5 rounded bg-green-500/10 border border-green-500/30">
                <div className="text-xs text-muted-foreground mb-0.5">健康度指数</div>
                <div className="font-mono font-semibold text-green-400">
                  {result.healthScore}%
                  <span className="text-xs ml-1 opacity-70">
                    (可信{result.finalCred}−压{result.finalPressure})
                  </span>
                </div>
              </div>
              <span className="text-muted-foreground text-lg">×</span>
              <div className="text-center px-3 py-1.5 rounded bg-muted/30 border border-border">
                <div className="text-xs text-muted-foreground mb-0.5">满分</div>
                <div className="font-mono font-semibold">100</div>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            {[
              { label: "转化人数", value: `${result.convertedCount}/${result.totalPeople}` },
              { label: "剩余资源", value: String(result.resourcesLeft) },
              { label: "共用回合", value: String(result.totalRounds) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-muted/20 rounded-lg p-3 border border-border">
                <div className="font-semibold text-base">{value}</div>
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
              {result.hiddenTiesStats.activatedPairs.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  <span className="text-green-400 font-medium">已激活：</span>
                  {result.hiddenTiesStats.activatedPairs.join("、")}
                </div>
              )}
              {result.hiddenTiesStats.missedPairs.length > 0 && (
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
            {sessionId !== null && (
              <Link href={`/history`} className="flex-1">
                <Button variant="outline" className="w-full gap-1.5">
                  我的记录
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            )}
          </div>
        </TabsContent>

        {/* ── Leaderboard tab ── */}
        <TabsContent value="leaderboard" className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
          <LeaderboardPanel playerName={playerName} currentSessionId={sessionId} />
        </TabsContent>

        {/* ── Turn log tab ── */}
        <TabsContent value="turns" className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
          {sessionId !== null ? (
            <TurnLog sessionId={sessionId} />
          ) : (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
              无会话记录
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Main GamePage ─────────────────────────────────────────────────────────────
export default function GamePage() {
  const { playerName } = usePlayerName();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [gameReady, setGameReady] = useState<boolean | null>(null);

  const startSession = trpc.game.startSession.useMutation();
  const saveTurnMutation = trpc.game.saveTurn.useMutation();
  const endSession = trpc.game.endSession.useMutation();

  const sessionIdRef = useRef<number | null>(null);
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

  const handleStartGame = async (name?: string) => {
    const activeName = name ?? playerName;
    if (!activeName) return;
    try {
      const session = await startSession.mutateAsync({ playerName: activeName });
      setSessionId(session.sessionId);
      sessionIdRef.current = session.sessionId;
      setGameResult(null);
      setGameReady(false);
      setIframeKey(k => k + 1);
      await new Promise(r => setTimeout(r, 50));
    } catch {
      toast.error("无法创建游戏会话，请重试");
    }
  };

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

    if (event.data.type === "GAME_ENDED" && sid !== null) {
      const result = event.data.result as GameResult;
      setGameResult(result);
      try {
        await endSessionRef.current({
          sessionId: sid,
          status: result.won ? "win" : "fail",
          resourcesLeft: result.resourcesLeft,
          finalCredibility: result.finalCred,
          finalPressure: result.finalPressure,
          convertedCount: result.convertedCount,
          totalRounds: result.totalRounds,
          totalScore: result.totalScore,
          baseScore: result.baseScore,
          healthScore: result.healthScore,
          aggressiveIndex: result.aggressiveIndex ?? 0,
          conservativeIndex: result.conservativeIndex ?? 0,
        });
        toast.success(`🎮 游戏结束！综合得分 ${result.totalScore} 分，记录已保存`);
      } catch (err) {
        console.error("[endSession] failed:", err);
        toast.error("保存游戏记录失败，请截图联系管理员");
      }
    }
  }, []);

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
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleStartGame()}>
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
        <PostGameSummary
          result={gameResult}
          sessionId={sessionId}
          playerName={playerName}
          onRestart={() => handleStartGame()}
        />
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
            <h2 className="text-2xl font-bold mb-2">准备出发，{playerName}</h2>
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
