import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GitCompare, Home } from "lucide-react";
import { Link } from "wouter";

function ScoreBadge({ score }: { score: number | null }) {
  const s = Number(score ?? 0);
  return (
    <span className={`font-bold ${s > 0 ? "text-green-400" : s < 0 ? "text-destructive" : "text-muted-foreground"}`}>
      {s > 0 ? "+" : ""}{s}
    </span>
  );
}

export default function ComparePage() {
  const params = useParams<{ idA: string; idB: string }>();
  const idA = parseInt(params.idA ?? "0");
  const idB = parseInt(params.idB ?? "0");

  const { data, isLoading, error } = trpc.compare.sessions.useQuery(
    { sessionIdA: idA, sessionIdB: idB },
    { enabled: !!(idA && idB) }
  );

  if (!idA || !idB) {
    return (
      <div className="container py-8 text-center">
        <p className="text-muted-foreground">请从排行榜选择两局进行对比</p>
        <Link href="/leaderboard"><Button variant="outline" className="mt-4">返回排行榜</Button></Link>
      </div>
    );
  }

  if (isLoading) return <div className="container py-8 text-center text-muted-foreground">加载中...</div>;
  if (error) return <div className="container py-8 text-center text-destructive">加载失败：{error.message}</div>;
  if (!data) return null;

  const { sessionA, turnsA, sessionB, turnsB } = data;
  const maxRound = Math.max(turnsA.length, turnsB.length);

  return (
    <div className="container py-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/leaderboard">
          <Button variant="ghost" size="sm" className="gap-1.5 shrink-0">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">返回排行榜</span>
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">主页</span>
          </Button>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <GitCompare className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
            决策对比
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">逐回合对比两位玩家的策略选择</p>
        </div>
      </div>

      {/* Session headers — 2 cols always, but responsive content */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { session: sessionA, label: "玩家 A" },
          { session: sessionB, label: "玩家 B" },
        ].map(({ session, label }) => (
          <Card key={label} className="bg-card border-border">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted-foreground">{label}</span>
                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">已完成</Badge>
              </div>
              <div className="font-bold text-sm sm:text-base truncate">{session.playerName ?? "匿名"}</div>
              <div className="text-2xl sm:text-3xl font-bold text-primary mt-1">{Number(session.totalScore ?? 0).toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">综合得分</div>
              {/* Mini stats: 2-col on mobile, 3-col on sm+ */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-2 text-xs text-center">
                {[
                  { label: "转化", value: `${session.convertedCount ?? 0}/12` },
                  { label: "剩余", value: session.resourcesLeft ?? 0 },
                  { label: "回合", value: session.totalRounds ?? 0 },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-muted/20 rounded p-1 sm:p-1.5">
                    <div className="font-semibold">{value}</div>
                    <div className="text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Turn-by-turn comparison */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3 px-4">
          <CardTitle className="text-sm sm:text-base">逐回合决策对比</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {maxRound === 0 ? (
            <div className="p-8 text-center text-muted-foreground">暂无回合记录</div>
          ) : (
            <div className="divide-y divide-border">
              {/* Desktop column headers */}
              <div className="hidden sm:grid grid-cols-[48px_1fr_1fr] gap-0 py-2 text-xs text-muted-foreground font-medium">
                <div className="text-center border-r border-border">回合</div>
                <div className="px-4">玩家 A</div>
                <div className="px-4 border-l border-border">玩家 B</div>
              </div>

              {Array.from({ length: maxRound }, (_, i) => {
                const tA = turnsA[i];
                const tB = turnsB[i];
                return (
                  <div key={i}>
                    {/* Desktop: 3-col grid */}
                    <div className="hidden sm:grid grid-cols-[48px_1fr_1fr] gap-0">
                      <div className="flex items-center justify-center border-r border-border bg-muted/10 text-xs font-mono text-muted-foreground py-4">
                        R{i + 1}
                      </div>
                      <TurnCell turn={tA} />
                      <TurnCell turn={tB} borderLeft />
                    </div>

                    {/* Mobile: stacked layout */}
                    <div className="sm:hidden">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/10 border-b border-border/50">
                        <span className="text-xs font-mono font-bold text-primary">第 {i + 1} 回合</span>
                      </div>
                      <div className="grid grid-cols-2 gap-0 divide-x divide-border">
                        <div>
                          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted/5 border-b border-border/30">A</div>
                          <TurnCellMobile turn={tA} />
                        </div>
                        <div>
                          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted/5 border-b border-border/30">B</div>
                          <TurnCellMobile turn={tB} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type TurnType = typeof import("../../../drizzle/schema").gameTurns.$inferSelect | undefined;

function TurnCell({ turn, borderLeft }: { turn: TurnType; borderLeft?: boolean }) {
  if (!turn) {
    return (
      <div className={`p-4 text-center text-muted-foreground text-xs ${borderLeft ? "border-l border-border" : ""}`}>
        —
      </div>
    );
  }

  const targets = (turn.targets as string[] | null) ?? [];
  const deltas = (turn.scoreDeltas as Array<{ personId: string; nameCn: string; before: number; after: number }> | null) ?? [];

  return (
    <div className={`p-4 space-y-2 ${borderLeft ? "border-l border-border" : ""}`}>
      {/* Action */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="text-xs border-primary/30 text-primary">
          {turn.actionLabel ?? turn.actionId ?? "—"}
        </Badge>
        {targets.map(t => (
          <span key={t} className="text-xs text-muted-foreground bg-muted/20 rounded px-1.5 py-0.5">{t}</span>
        ))}
      </div>

      {turn.prediction && (
        <div className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2 line-clamp-2">
          "{turn.prediction}"
        </div>
      )}

      {/* Score deltas */}
      {deltas.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {deltas.slice(0, 4).map(d => (
            <span key={d.personId} className="text-xs">
              {d.nameCn}: <ScoreBadge score={d.after - d.before} />
            </span>
          ))}
          {deltas.length > 4 && <span className="text-xs text-muted-foreground">+{deltas.length - 4}人</span>}
        </div>
      )}

      <div className="flex gap-3 text-xs text-muted-foreground">
        <span>可信 <span className="text-green-400">{turn.credibilityAfter}</span></span>
        <span>压力 <span className="text-destructive">{turn.pressureAfter}</span></span>
        <span>资源 <span className="text-primary">{turn.resourcesAfter}</span></span>
      </div>
    </div>
  );
}

function TurnCellMobile({ turn }: { turn: TurnType }) {
  if (!turn) {
    return <div className="p-2 text-center text-muted-foreground text-xs min-h-[60px] flex items-center justify-center">—</div>;
  }

  const targets = (turn.targets as string[] | null) ?? [];
  const deltas = (turn.scoreDeltas as Array<{ personId: string; nameCn: string; before: number; after: number }> | null) ?? [];

  return (
    <div className="p-2 space-y-1.5">
      <div>
        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary max-w-full truncate">
          {turn.actionLabel ?? turn.actionId ?? "—"}
        </Badge>
      </div>
      {targets.length > 0 && (
        <div className="flex flex-wrap gap-0.5">
          {targets.slice(0, 3).map(t => (
            <span key={t} className="text-[10px] text-muted-foreground bg-muted/20 rounded px-1 py-0.5 truncate max-w-[70px]">{t}</span>
          ))}
          {targets.length > 3 && <span className="text-[10px] text-muted-foreground">+{targets.length - 3}</span>}
        </div>
      )}
      {deltas.length > 0 && (
        <div className="flex flex-wrap gap-0.5">
          {deltas.slice(0, 2).map(d => (
            <span key={d.personId} className="text-[10px]">
              {d.nameCn}: <ScoreBadge score={d.after - d.before} />
            </span>
          ))}
          {deltas.length > 2 && <span className="text-[10px] text-muted-foreground">+{deltas.length - 2}</span>}
        </div>
      )}
      <div className="flex gap-1.5 text-[10px] text-muted-foreground">
        <span>信<span className="text-green-400">{turn.credibilityAfter}</span></span>
        <span>压<span className="text-destructive">{turn.pressureAfter}</span></span>
        <span>资<span className="text-primary">{turn.resourcesAfter}</span></span>
      </div>
    </div>
  );
}
