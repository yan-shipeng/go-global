import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { Trophy, GitCompare, History, Gamepad2, Zap, Pencil, ArrowRight, SkipForward } from "lucide-react";
import { usePlayerName } from "@/hooks/usePlayerName";

const BRIEFING_URL = "/manus-storage/game-engine_4e9f1f12.html?mode=briefing";

type HomeStep = "landing" | "name-entry" | "briefing";

export default function Home() {
  const { playerName, setPlayerName } = usePlayerName();
  const [step, setStep] = useState<HomeStep>("landing");
  const [nameInput, setNameInput] = useState(playerName ?? "");
  const [, navigate] = useLocation();

  // ── Step: Name Entry ──────────────────────────────────────────────────────
  const handleNameConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setPlayerName(trimmed);
    setStep("briefing");
  };

  // ── Step: Go directly to game (skip briefing) ─────────────────────────────
  const handleSkipBriefing = () => {
    navigate("/game");
  };

  // ── Step: Go to game after reading briefing ───────────────────────────────
  const handleEnterGame = () => {
    navigate("/game");
  };

  // ── Briefing screen ───────────────────────────────────────────────────────
  if (step === "briefing") {
    return (
      <div className="flex flex-col h-[calc(100vh-56px)]">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50 shrink-0">
          <div className="text-sm text-muted-foreground">
            任务简报 · <span className="text-primary font-medium">{playerName}</span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-muted-foreground"
              onClick={handleSkipBriefing}
            >
              <SkipForward className="w-3.5 h-3.5" />
              跳过说明，直接开始
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-primary hover:bg-primary/90"
              onClick={handleEnterGame}
            >
              <ArrowRight className="w-3.5 h-3.5" />
              我已了解，进入模拟
            </Button>
          </div>
        </div>

        {/* Briefing iframe — shows the game engine's intro slides in read-only briefing mode */}
        <iframe
          src={BRIEFING_URL}
          className="flex-1 w-full border-none"
          title="任务简报"
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      </div>
    );
  }

  // ── Name entry screen ─────────────────────────────────────────────────────
  if (step === "name-entry") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] gap-6 px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🚀</div>
          <h2 className="text-2xl font-bold mb-2">输入你的名字</h2>
          <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
            名字将显示在排行榜上，无需注册账号。
          </p>
        </div>
        <form onSubmit={handleNameConfirm} className="flex flex-col gap-3 w-full max-w-xs">
          <Input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="例：张三 / Alice"
            maxLength={32}
            autoFocus
            className="bg-card border-border text-center text-lg h-12"
          />
          <Button
            type="submit"
            size="lg"
            className="bg-primary hover:bg-primary/90 gap-2"
            disabled={!nameInput.trim()}
          >
            确认，查看任务说明 <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => setStep("landing")}
          >
            返回
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            名字保存在本地浏览器，下次访问自动沿用
          </p>
        </form>
      </div>
    );
  }

  // ── Landing page ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col">
      {/* Hero */}
      <section className="relative flex-1 flex flex-col items-center justify-center text-center px-4 py-20 overflow-hidden">
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

          {/* CTA — adapts based on whether name is already set */}
          {playerName ? (
            <div className="flex flex-col items-center gap-3">
              {/* Greeting with edit option */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
                <span className="text-muted-foreground text-sm">你好，</span>
                <span className="text-primary font-semibold">{playerName}</span>
                <button
                  onClick={() => { setNameInput(playerName); setStep("name-entry"); }}
                  className="text-muted-foreground hover:text-primary transition-colors ml-1"
                  title="修改名字"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  size="lg"
                  className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8"
                  onClick={() => setStep("briefing")}
                >
                  <Gamepad2 className="w-4 h-4" />
                  查看任务说明 →
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 px-8"
                  onClick={handleSkipBriefing}
                >
                  <SkipForward className="w-4 h-4" />
                  跳过说明，直接开始
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8"
                onClick={() => setStep("name-entry")}
              >
                <Gamepad2 className="w-4 h-4" />
                开始游戏
              </Button>
              <Link href="/leaderboard">
                <Button size="lg" variant="outline" className="gap-2 px-8">
                  <Trophy className="w-4 h-4" />
                  查看排行榜
                </Button>
              </Link>
            </div>
          )}
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
                desc: "12 位角色、13 种动作、隐藏关系网络，每局都是全新挑战",
                href: "/game",
              },
              {
                icon: Trophy,
                title: "全球排行榜",
                desc: "综合得分 = 转化率 × 健康度指数 × 100，满分 100 分，两个维度相乘，缺一不可",
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

          {/* Formula display */}
          <div className="flex flex-wrap justify-center gap-3 items-center text-sm mb-6">
            <div className="px-4 py-3 rounded-lg bg-card border border-primary/40">
              <div className="text-xs text-muted-foreground mb-1">转化率</div>
              <div className="font-mono font-semibold text-primary">转化人数 ÷ 12</div>
            </div>
            <span className="text-muted-foreground text-2xl font-light">×</span>
            <div className="px-4 py-3 rounded-lg bg-card border border-green-500/40">
              <div className="text-xs text-muted-foreground mb-1">健康度指数</div>
              <div className="font-mono font-semibold text-green-400">(max(0, 可信度−压力) + 10) ÷ 20</div>
            </div>
            <span className="text-muted-foreground text-2xl font-light">×</span>
            <div className="px-4 py-3 rounded-lg bg-card border border-border">
              <div className="text-xs text-muted-foreground mb-1">满分</div>
              <div className="font-mono font-semibold text-foreground">100</div>
            </div>
          </div>

          {/* Explanation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-xl mx-auto mb-4">
            <div className="px-4 py-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="text-xs font-semibold text-primary mb-1">转化率（0–1）</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                12 人全转化 = 1.0，6 人 = 0.5。转化越多，乘数越大。
              </p>
            </div>
            <div className="px-4 py-3 rounded-lg bg-green-500/5 border border-green-500/20">
              <div className="text-xs font-semibold text-green-400 mb-1">健康度指数（0–1）</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                可信度 10、压力 0 时 = 1.0；两者相等时 = 0.5；压力远超可信度时趋近 0。
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            两个维度相乘：任何一项极差都会大幅拉低总分。满分 100 分（12 人全转化 × 最佳健康度）。
          </p>
        </div>
      </section>
    </div>
  );
}
