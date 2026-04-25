import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, TrendingUp, ChevronDown, ChevronUp, GitCompare } from "lucide-react";
import { Link } from "wouter";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { usePlayerName } from "@/hooks/usePlayerName";
import type { GameSession } from "../../../drizzle/schema";

export default function HistoryPage() {
  const { playerName } = usePlayerName();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: sessions, isLoading } = trpc.history.byPlayerName.useQuery(
    { playerName: playerName || "" },
    { enabled: !!playerName }
  );

  if (!playerName) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">请先前往「开始游戏」页面输入名字，再查看历史记录</p>
        <Link href="/game">
          <Button className="bg-primary hover:bg-primary/90">去开始游戏</Button>
        </Link>
      </div>
    );
  }

  const chartData = sessions
    ?.filter((s: GameSession) => s.status !== "active")
    .map((s: GameSession, i: number) => ({
      局次: `第${i + 1}局`,
      得分: Number(s.totalScore ?? 0),
      可信度: s.finalCredibility ?? 0,
      压力: s.finalPressure ?? 0,
    })) ?? [];

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <History className="w-8 h-8 text-primary" />
          个人历史
        </h1>
        <p className="text-muted-foreground mt-1">{playerName} 的所有游戏记录</p>
      </div>

      {/* Trend chart */}
      {chartData.length >= 2 && (
        <Card className="bg-card border-border mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              得分趋势
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="局次" tick={{ fill: "#5a8090", fontSize: 12 }} />
                <YAxis tick={{ fill: "#5a8090", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: "#0d1e2a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                  labelStyle={{ color: "#d8eef4" }}
                />
                <Line type="monotone" dataKey="得分" stroke="#0d8b96" strokeWidth={2} dot={{ fill: "#0d8b96" }} />
                <Line type="monotone" dataKey="可信度" stroke="#22c55e" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                <Line type="monotone" dataKey="压力" stroke="#ef4444" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Sessions list */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">所有对局（{sessions?.length ?? 0} 局）</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">加载中...</div>
          ) : !sessions?.length ? (
            <div className="p-8 text-center text-muted-foreground">
              还没有游戏记录，快去开始第一局吧！
              <br />
              <Link href="/game">
                <Button className="mt-4 bg-primary hover:bg-primary/90">开始游戏</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {sessions.map((session: GameSession, idx: number) => (
                <div key={session.id}>
                  <div
                    className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-muted/10 transition-colors"
                    onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
                  >
                    <span className="text-sm text-muted-foreground font-mono w-8">#{sessions.length - idx}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">已完成</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(session.startedAt).toLocaleDateString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">{Number(session.totalScore ?? 0).toFixed(1)}</div>
                      <div className="text-xs text-muted-foreground">分</div>
                    </div>
                    <div className="text-muted-foreground">
                      {expandedId === session.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {expandedId === session.id && (
                    <div className="px-4 pb-4 bg-muted/5">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        {[
                          { label: "转化人数", value: `${session.convertedCount ?? 0}/12` },
                          { label: "剩余资源", value: session.resourcesLeft ?? 0 },
                          { label: "最终可信度", value: session.finalCredibility ?? 0, color: "text-green-400" },
                          { label: "最终压力", value: session.finalPressure ?? 0, color: "text-destructive" },
                        ].map(({ label, value, color }) => (
                          <div key={label} className="bg-muted/20 rounded p-2 text-center text-sm">
                            <div className={`font-semibold ${color ?? ""}`}>{value}</div>
                            <div className="text-xs text-muted-foreground">{label}</div>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs text-center mb-3">
                          {[
                            { label: "基础分", value: session.baseScore ?? 0 },
                            { label: "效率分", value: `+${Number(session.efficiencyScore ?? 0).toFixed(1)}` },
                            { label: "健康度分", value: `${Number(session.healthScore ?? 0) >= 0 ? "+" : ""}${Number(session.healthScore ?? 0).toFixed(1)}` },
                            { label: "超额转化", value: `+${Number(session.overAchievementScore ?? 0).toFixed(1)}` },
                          ].map(({ label, value }) => (
                            <div key={label} className="bg-primary/10 rounded p-1.5">
                              <div className="font-semibold text-primary">{value}</div>
                              <div className="text-muted-foreground">{label}</div>
                            </div>
                          ))}
                        </div>
                      <Link href={`/compare/${session.id}/${sessions.find((s: GameSession) => s.id !== session.id)?.id ?? session.id}`}>
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                          <GitCompare className="w-3 h-3" />
                          与其他局对比
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
