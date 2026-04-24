import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Trophy, GitCompare, History, Gamepad2, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col">
      {/* Hero */}
      <section className="relative flex-1 flex flex-col items-center justify-center text-center px-4 py-20 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium mb-6">
            <Zap className="w-3 h-3" />
            EMBA 变革管理模拟 · 多人竞技版
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 leading-tight">
            中国企业
            <span className="text-primary"> 出海变革</span>
            <br />
            模拟挑战
          </h1>

          <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
            你被派往海外，执行一场组织整合。<br />
            在 48 个资源内，说服 12 位关键人物接受变革。<br />
            与同学同台竞技，比较策略差异，洞察组织动态。
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/game">
              <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8">
                <Gamepad2 className="w-4 h-4" />
                开始游戏
              </Button>
            </Link>
            <Link href="/leaderboard">
              <Button size="lg" variant="outline" className="gap-2 px-8">
                <Trophy className="w-4 h-4" />
                查看排行榜
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 border-t border-border">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10 text-foreground">平台功能</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Gamepad2,
                title: "沉浸式模拟",
                desc: "12 位角色、8 种动作、隐藏关系网络，每局都是全新挑战",
                href: "/game",
              },
              {
                icon: Trophy,
                title: "全球排行榜",
                desc: "综合得分 = 效率 + 健康度 + 超额转化，剩余资源越多排名越高",
                href: "/leaderboard",
              },
              {
                icon: GitCompare,
                title: "决策对比",
                desc: "逐回合对比任意两位玩家的动作选择与预判，发现策略差异",
                href: "/compare",
              },
              {
                icon: History,
                title: "个人历史",
                desc: "查看所有历史局次，追踪可信度、压力、转化率的变化趋势",
                href: "/history",
              },
            ].map(({ icon: Icon, title, desc, href }) => (
              <Link key={href} href={href}>
                <Card className="h-full bg-card border-border hover:border-primary/50 transition-colors cursor-pointer group">
                  <CardContent className="p-5">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1.5">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Score formula */}
      <section className="py-12 px-4 border-t border-border bg-card/30">
        <div className="container max-w-3xl mx-auto text-center">
          <h2 className="text-xl font-bold mb-6 text-foreground">综合得分算法</h2>
          <div className="flex flex-wrap justify-center gap-3 items-center text-sm">
            {[
              { label: "基础分", value: "50", color: "text-foreground" },
              { label: "+", value: "", color: "text-muted-foreground" },
              { label: "效率分", value: "剩余资源 × 1.5", color: "text-primary" },
              { label: "+", value: "", color: "text-muted-foreground" },
              { label: "健康度分", value: "(可信度 − 压力) × 2", color: "text-green-400" },
              { label: "+", value: "", color: "text-muted-foreground" },
              { label: "超额转化分", value: "(转化数 − 6) × 3", color: "text-yellow-400" },
            ].map((item, i) => (
              item.value === "" ? (
                <span key={i} className="text-muted-foreground text-lg font-light">+</span>
              ) : (
                <div key={i} className="px-3 py-2 rounded-lg bg-card border border-border">
                  <div className="text-xs text-muted-foreground mb-0.5">{item.label}</div>
                  <div className={`font-mono font-semibold ${item.color}`}>{item.value}</div>
                </div>
              )
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            * 仅通关（≥50% 转化）的局次计入排行榜
          </p>
        </div>
      </section>
    </div>
  );
}
