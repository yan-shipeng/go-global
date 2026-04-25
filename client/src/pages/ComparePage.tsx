import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GitCompare } from "lucide-react";
import { Link } from "wouter";

function ScoreBadge({ score }: { score: number | null }) {
  const s = Number(score ?? 0);
  return <span className={`font-bold ${s > 0 ? "text-green-400" : s < 0 ? "text-destructive" : "text-muted-foreground"}`}>{s > 0 ? "+" : ""}{s}</span>;
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
    <div className="container py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/leaderboard">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            排行榜
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GitCompare className="w-6 h-6 text-primary" />
            决策对比
          </h1>
          <p className="text-sm text-muted-foreground">逐回合对比两位玩家的策略选择</p>
        </div>
      </div>

      {/* Session headers */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { session: sessionA, label: "玩家 A" },
          { session: sessionB, label: "玩家 B" },
        ].map(({ session, label }) => (
          <Card key={label} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{label}</span>
                <Badge className="bg-primary/20 text-primary border-primary/30">已完成</Badge>
              </div>
              <div className="font-bold text-lg">{session.playerName ?? "匿名"}</div>
              <div className="text-3xl font-bold text-primary mt-1">{Number(session.totalScore ?? 0).toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">综合得分</div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-center">
                {[
                  { label: "转化", value: `${session.convertedCount ?? 0}/12` },
                  { label: "剩余资源", value: session.resourcesLeft ?? 0 },
                  { label: "回合数", value: session.totalRounds ?? 0 },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-muted/20 rounded p-1.5">
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
        <CardHeader className="pb-3">
          <CardTitle className="text-base">逐回合决策对比</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {maxRound === 0 ? (
            <div className="p-8 text-center text-muted-foreground">暂无回合记录</div>
          ) : (
            <div className="divide-y divide-border">
              {Array.from({ length: maxRound }, (_, i) => {
                const tA = turnsA[i];
                const tB = turnsB[i];
                return (
                  <div key={i} className="grid grid-cols-[48px_1fr_1fr] gap-0">
                    {/* Round number */}
                    <div className="flex items-center justify-center border-r border-border bg-muted/10 text-xs font-mono text-muted-foreground py-4">
                      R{i + 1}
                    </div>
                    {/* Player A */}
                    <TurnCell turn={tA} />
                    {/* Player B */}
                    <TurnCell turn={tB} borderLeft />
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

function TurnCell({ turn, borderLeft }: { turn: typeof import("../../../drizzle/schema").gameTurns.$inferSelect | undefined; borderLeft?: boolean }) {
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

      {/* Prediction */}
      {turn.prediction && (
        <div className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">
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

      {/* State after */}
      <div className="flex gap-3 text-xs text-muted-foreground">
        <span>可信 <span className="text-green-400">{turn.credibilityAfter}</span></span>
        <span>压力 <span className="text-destructive">{turn.pressureAfter}</span></span>
        <span>资源 <span className="text-primary">{turn.resourcesAfter}</span></span>
      </div>
    </div>
  );
}
