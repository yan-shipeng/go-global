/**
 * /game-summary?sessionId=X&playerName=Y
 *
 * A frameless, embeddable page that renders the full post-game summary
 * (本局总览 / 排行榜 / 回合日志) for a given sessionId.
 *
 * Designed to be embedded as an <iframe> inside the game engine's ending screen
 * via the INJECT_SUMMARY postMessage mechanism. Runs inside the same React app
 * so it has full tRPC data access.
 */

import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

// ─── URL param helpers ────────────────────────────────────────────────────────
function useQueryParam(key: string): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

// ─── Strategy bias ────────────────────────────────────────────────────────────
function strategyBias(agg: number, con: number) {
  const total = agg + con;
  if (total === 0) return { label: "-", cls: "text-muted-foreground" };
  const ratio = agg / total;
  if (ratio >= 0.6) return { label: "⚡ 制度主导型", cls: "text-amber-400 border-amber-500/40 bg-amber-500/10" };
  if (ratio <= 0.35) return { label: "💬 沟通主导型", cls: "text-primary border-primary/40 bg-primary/10" };
  return { label: "⚖️ 均衡型", cls: "text-green-400 border-green-500/40 bg-green-500/10" };
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-xl">🥇</span>;
  if (rank === 2) return <span className="text-xl">🥈</span>;
  if (rank === 3) return <span className="text-xl">🥉</span>;
  return <span className="text-muted-foreground font-mono text-sm w-8 text-center">#{rank}</span>;
}

// ─── Turn Log ─────────────────────────────────────────────────────────────────
function TurnLog({ sessionId }: { sessionId: number }) {
  const { data, isLoading } = trpc.game.getSession.useQuery({ sessionId });
  if (isLoading) return <div className="py-8 text-center text-muted-foreground text-sm">加载回合日志…</div>;
  const turns = data?.turns ?? [];
  if (turns.length === 0) return <div className="py-8 text-center text-muted-foreground text-sm">暂无回合记录</div>;
  return (
    <div className="space-y-2">
      {turns.map((t, idx) => {
        const prev = idx > 0 ? turns[idx - 1] : null;
        const credDelta = prev != null ? (t.credibilityAfter ?? 0) - (prev.credibilityAfter ?? 0) : 0;
        const pressDelta = prev != null ? (t.pressureAfter ?? 0) - (prev.pressureAfter ?? 0) : 0;
        const targets = (t.targets as string[]) ?? [];
        return (
          <div key={t.id} className="rounded-lg border border-border bg-card/40 p-3 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-muted-foreground w-12 shrink-0">R{t.round}</span>
              <span className="text-sm font-medium flex-1 min-w-0 truncate">{t.actionLabel || t.actionId}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded border shrink-0 ${
                t.outcome === "success"
                  ? "text-green-400 border-green-500/30 bg-green-500/10"
                  : "text-amber-400 border-amber-500/30 bg-amber-500/10"
              }`}>
                {t.outcome === "success" ? "✓ 转化" : "△ 部分"}
              </span>
            </div>
            {targets.length > 0 && (
              <div className="text-xs text-muted-foreground pl-14">目标：{targets.join("、")}</div>
            )}
            <div className="flex items-center gap-3 pl-14 text-xs">
              <span className="text-muted-foreground">
                可信度 <span className={credDelta > 0 ? "text-green-400" : credDelta < 0 ? "text-red-400" : "text-muted-foreground"}>
                  {credDelta > 0 ? `+${credDelta}` : credDelta !== 0 ? String(credDelta) : "±0"}
                </span> → {t.credibilityAfter ?? "-"}
              </span>
              <span className="text-muted-foreground">
                压力 <span className={pressDelta < 0 ? "text-green-400" : pressDelta > 0 ? "text-red-400" : "text-muted-foreground"}>
                  {pressDelta > 0 ? `+${pressDelta}` : pressDelta !== 0 ? String(pressDelta) : "±0"}
                </span> → {t.pressureAfter ?? "-"}
              </span>
              <span className="text-muted-foreground">资源 → {t.resourcesAfter ?? "-"}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────
function LeaderboardPanel({ playerName, currentSessionId }: { playerName: string; currentSessionId: number }) {
  const { data } = trpc.leaderboard.list.useQuery({ limit: 50 });
  const rows = data ?? [];
  const currentRowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (currentRowRef.current) {
      const t = setTimeout(() => currentRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 200);
      return () => clearTimeout(t);
    }
  }, [data]);
  if (rows.length === 0) return <div className="py-8 text-center text-muted-foreground text-sm">暂无排行榜数据</div>;
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
              isCurrent ? "border-primary/50 bg-primary/10" : isMe ? "border-border bg-muted/30" : "border-border bg-card/30"
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
              <div className="font-bold text-primary">{row.totalScore?.toFixed(1) ?? "-"}</div>
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

// ─── Overview ─────────────────────────────────────────────────────────────────
function Overview({ sessionId }: { sessionId: number }) {
  const { data } = trpc.game.getSession.useQuery({ sessionId });
  if (!data) return <div className="py-8 text-center text-muted-foreground text-sm">加载中…</div>;

  const s = data.session;
  const totalScore = Number(s.totalScore) || 0;
  const convertedCount = Number(s.convertedCount) || 0;
  const resourcesLeft = Number(s.resourcesLeft) || 0;
  const totalRounds = Number(s.totalRounds) || 0;
  const finalCred = Number(s.finalCredibility) || 0;
  const finalPressure = Number(s.finalPressure) || 0;
  const healthScore = Number(s.healthScore) || 0;
  const agg = Number(s.aggressiveIndex) || 0;
  const con = Number(s.conservativeIndex) || 0;
  const bias = strategyBias(agg, con);

  return (
    <div className="space-y-4">
      {/* Score card */}
      <div className="rounded-lg border border-border bg-card/50 p-4 space-y-3">
        <div className="text-center">
          <div className="text-5xl font-bold text-primary">{totalScore}</div>
          <div className="text-sm text-muted-foreground mt-1">综合得分（满分 100）</div>
          {(agg + con) > 0 && (
            <div className={`inline-block mt-2 px-3 py-0.5 rounded-full border text-xs font-medium ${bias.cls}`}>
              {bias.label}
            </div>
          )}
        </div>
        {/* Formula */}
        <div className="flex items-center justify-center gap-2 text-sm flex-wrap pt-1">
          <div className="text-center px-3 py-1.5 rounded bg-primary/10 border border-primary/30">
            <div className="text-xs text-muted-foreground mb-0.5">转化率</div>
            <div className="font-mono font-semibold text-primary">
              {convertedCount}/12
              <span className="text-xs ml-1 opacity-70">= {Math.round(convertedCount / 12 * 100)}%</span>
            </div>
          </div>
          <span className="text-muted-foreground text-lg">×</span>
          <div className="text-center px-3 py-1.5 rounded bg-green-500/10 border border-green-500/30">
            <div className="text-xs text-muted-foreground mb-0.5">健康度指数</div>
            <div className="font-mono font-semibold text-green-400">
              {healthScore}%
              <span className="text-xs ml-1 opacity-70">(可信{finalCred}−压{finalPressure})</span>
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
          { label: "转化人数", value: `${convertedCount}/12` },
          { label: "剩余资源", value: String(resourcesLeft) },
          { label: "共用回合", value: String(totalRounds) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-muted/20 rounded-lg p-3 border border-border">
            <div className="font-semibold text-base text-foreground">{value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function GameSummaryPage() {
  const sessionIdStr = useQueryParam("sessionId");
  const playerName = useQueryParam("playerName") ?? "";
  const sessionId = sessionIdStr ? parseInt(sessionIdStr, 10) : null;

  if (!sessionId || isNaN(sessionId)) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-muted-foreground text-sm">缺少 sessionId 参数</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Compact header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-card/60 shrink-0">
        <Trophy className="w-4 h-4 text-primary shrink-0" />
        <span className="text-sm font-semibold text-foreground">结算复盘</span>
        {playerName && <span className="text-xs text-muted-foreground">· {playerName}</span>}
      </div>
      {/* Tabs */}
      <div className="flex flex-col flex-1 min-h-0">
        <Tabs defaultValue="overview" className="flex flex-col flex-1 min-h-0">
          <div className="px-4 pt-3 pb-1 shrink-0 border-b border-border/50">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="overview" className="flex-1 sm:flex-none">📊 本局总览</TabsTrigger>
              <TabsTrigger value="leaderboard" className="flex-1 sm:flex-none">🏆 排行榜</TabsTrigger>
              <TabsTrigger value="turns" className="flex-1 sm:flex-none">📋 回合日志</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="overview" className="flex-1 overflow-y-auto px-4 pb-6 pt-4 data-[state=inactive]:hidden">
            <Overview sessionId={sessionId} />
          </TabsContent>
          <TabsContent value="leaderboard" className="flex-1 overflow-y-auto px-4 pb-6 pt-4 data-[state=inactive]:hidden">
            <LeaderboardPanel playerName={playerName} currentSessionId={sessionId} />
          </TabsContent>
          <TabsContent value="turns" className="flex-1 overflow-y-auto px-4 pb-6 pt-4 data-[state=inactive]:hidden">
            <TurnLog sessionId={sessionId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
