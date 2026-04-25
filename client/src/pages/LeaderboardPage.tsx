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
    <div className="container py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-400" />
            排行榜
          </h1>
          <p className="text-muted-foreground mt-1">所有玩家的综合得分排名</p>
        </div>
        {selectedIds.length === 2 && (
          <Link href={`/compare/${selectedIds[0]}/${selectedIds[1]}`}>
            <Button className="gap-2 bg-primary hover:bg-primary/90">
              <GitCompare className="w-4 h-4" />
              对比选中的两局
            </Button>
          </Link>
        )}
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Users className="w-4 h-4" />, label: "完成局数", value: stats.count },
            { icon: <Trophy className="w-4 h-4 text-green-400" />, label: "平均效率分", value: `+${stats.avgEfficiency.toFixed(1)}` },
            { icon: <TrendingUp className="w-4 h-4 text-primary" />, label: "平均得分", value: stats.avgTotal.toFixed(1) },
            { icon: <Zap className="w-4 h-4 text-yellow-400" />, label: "平均健康度", value: stats.avgHealth.toFixed(1) },
          ].map(({ icon, label, value }) => (
            <Card key={label} className="bg-card border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted/30">{icon}</div>
                <div>
                  <div className="text-lg font-bold">{value}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tip for comparison */}
      {selectedIds.length < 2 && (
        <p className="text-sm text-muted-foreground mb-4">
          💡 点击任意两行可选中，然后进行决策对比（已选 {selectedIds.length}/2）
        </p>
      )}

      {/* Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
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
              {/* Header */}
              <div className="grid grid-cols-[48px_1fr_80px_80px_80px_80px_80px] gap-2 px-4 py-2 text-xs text-muted-foreground font-medium">
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
                    className={`grid grid-cols-[48px_1fr_80px_80px_80px_80px_80px] gap-2 px-4 py-3 cursor-pointer transition-colors text-sm
                      ${isSelected ? "bg-primary/10 border-l-2 border-primary" : "hover:bg-muted/20"}
                      ${isMe ? "bg-yellow-400/5" : ""}
                    `}
                  >
                    <div className="flex items-center">
                      <RankBadge rank={row.rank} />
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate font-medium">{row.playerName ?? "匿名"}</span>
                      {isMe && <Badge variant="outline" className="text-xs shrink-0 border-yellow-400/50 text-yellow-400">我</Badge>}
                      {row.status === "win" ? (
                        <Badge className="text-xs shrink-0 bg-green-500/20 text-green-400 border-green-500/30">通关</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs shrink-0 text-destructive border-destructive/30">失败</Badge>
                      )}
                    </div>
                    <div className="text-right font-bold text-primary">{Number(row.totalScore).toFixed(1)}</div>
                    <div className="text-right">{row.convertedCount ?? 0}/12</div>
                    <div className="text-right">{row.resourcesLeft ?? 0}</div>
                    <div className="text-right text-green-400">{row.finalCredibility ?? 0}</div>
                    <div className="text-right text-destructive">{row.finalPressure ?? 0}</div>
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
