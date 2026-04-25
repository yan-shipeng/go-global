import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, Users, Zap, GitCompare } from "lucide-react";
import { Link } from "wouter";
import { usePlayerName } from "@/hooks/usePlayerName";

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  return <span className="text-muted-foreground font-mono text-sm w-8 text-center">#{rank}</span>;
}

export default function LeaderboardPage() {
  const { playerName } = usePlayerName();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const { data: rows, isLoading } = trpc.leaderboard.list.useQuery({ limit: 50 });
  const { data: stats } = trpc.leaderboard.stats.useQuery();

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 2 ? [...prev, id] : [prev[1], id]
    );
  };

  return (
    <div className="container py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3">
            <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 shrink-0" />
            排行榜
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">所有玩家的综合得分排名</p>
        </div>
        {selectedIds.length === 2 && (
          <Link href={`/compare/${selectedIds[0]}/${selectedIds[1]}`}>
            <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90 shrink-0">
              <GitCompare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">对比选中的两局</span>
              <span className="sm:hidden">对比</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { icon: <Users className="w-4 h-4" />, label: "完成局数", value: stats.count },
            { icon: <Trophy className="w-4 h-4 text-green-400" />, label: "平均效率分", value: `+${stats.avgEfficiency.toFixed(1)}` },
            { icon: <TrendingUp className="w-4 h-4 text-primary" />, label: "平均得分", value: stats.avgTotal.toFixed(1) },
            { icon: <Zap className="w-4 h-4 text-yellow-400" />, label: "平均健康度", value: stats.avgHealth.toFixed(1) },
          ].map(({ icon, label, value }) => (
            <Card key={label} className="bg-card border-border">
              <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-muted/30 shrink-0">{icon}</div>
                <div className="min-w-0">
                  <div className="text-base sm:text-lg font-bold leading-tight">{value}</div>
                  <div className="text-xs text-muted-foreground truncate">{label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tip for comparison */}
      {selectedIds.length < 2 && (
        <p className="text-xs sm:text-sm text-muted-foreground mb-3">
          💡 点击任意两行可选中，然后进行决策对比（已选 {selectedIds.length}/2）
        </p>
      )}

      {/* Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3 px-4">
          <CardTitle className="text-base">全部记录</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">加载中...</div>
          ) : !rows?.length ? (
            <div className="p-8 text-center text-muted-foreground">
              暂无记录，快去完成第一局吧！
            </div>
          ) : (
            <div className="divide-y divide-border">
              {/* Desktop header row */}
              <div className="hidden sm:grid grid-cols-[48px_1fr_80px_80px_80px_80px_80px] gap-2 px-4 py-2 text-xs text-muted-foreground font-medium">
                <span>排名</span>
                <span>玩家</span>
                <span className="text-right">得分</span>
                <span className="text-right">转化</span>
                <span className="text-right">剩余</span>
                <span className="text-right">可信度</span>
                <span className="text-right">压力</span>
              </div>
              {rows.map(row => {
                const isMe = !!playerName && row.playerName === playerName;
                const isSelected = selectedIds.includes(row.id);
                return (
                  <div
                    key={row.id}
                    onClick={() => toggleSelect(row.id)}
                    className={`cursor-pointer transition-colors
                      ${isSelected ? "bg-primary/10 border-l-2 border-primary" : "hover:bg-muted/20"}
                      ${isMe ? "bg-yellow-400/5" : ""}
                    `}
                  >
                    {/* Desktop row */}
                    <div className="hidden sm:grid grid-cols-[48px_1fr_80px_80px_80px_80px_80px] gap-2 px-4 py-3 text-sm">
                      <div className="flex items-center">
                        <RankBadge rank={row.rank} />
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="truncate font-medium">{row.playerName ?? "匿名"}</span>
                        {isMe && <Badge variant="outline" className="text-xs shrink-0 border-yellow-400/50 text-yellow-400">我</Badge>}
                        <Badge className="text-xs shrink-0 bg-primary/20 text-primary border-primary/30">已完成</Badge>
                      </div>
                      <div className="text-right font-bold text-primary">{Number(row.totalScore).toFixed(1)}</div>
                      <div className="text-right">{row.convertedCount ?? 0}/12</div>
                      <div className="text-right">{row.resourcesLeft ?? 0}</div>
                      <div className="text-right text-green-400">{row.finalCredibility ?? 0}</div>
                      <div className="text-right text-destructive">{row.finalPressure ?? 0}</div>
                    </div>

                    {/* Mobile card row */}
                    <div className="sm:hidden px-4 py-3 flex items-center gap-3">
                      <div className="shrink-0 w-8 flex items-center justify-center">
                        <RankBadge rank={row.rank} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-sm truncate">{row.playerName ?? "匿名"}</span>
                          {isMe && <Badge variant="outline" className="text-xs border-yellow-400/50 text-yellow-400 shrink-0">我</Badge>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                          <span>转化 <span className="text-foreground">{row.convertedCount ?? 0}/12</span></span>
                          <span>可信 <span className="text-green-400">{row.finalCredibility ?? 0}</span></span>
                          <span>压力 <span className="text-destructive">{row.finalPressure ?? 0}</span></span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="font-bold text-primary text-base">{Number(row.totalScore).toFixed(1)}</div>
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
        </CardContent>
      </Card>
    </div>
  );
}
