import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { Gamepad2, Zap, Pencil, ArrowRight, SkipForward } from "lucide-react";
import { usePlayerName } from "@/hooks/usePlayerName";
import BriefingPage from "./BriefingPage";

type HomeStep = "landing" | "name-entry" | "briefing";

export default function Home() {
  const { playerName, setPlayerName } = usePlayerName();
  const [step, setStep] = useState<HomeStep>("landing");
  const [nameInput, setNameInput] = useState(playerName ?? "");
  const [, navigate] = useLocation();

  // ── Prefetch game engine bundle when user lands on home page ───────────────
  useEffect(() => {
    // Trigger the /game route chunk to be fetched in background
    // so the iframe srcdoc is already in the JS bundle when user navigates
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = "/game";
    document.head.appendChild(link);
    return () => { try { document.head.removeChild(link); } catch { /* ignore */ } };
  }, []);

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
      <BriefingPage
        playerName={playerName ?? ""}
        onEnterGame={() => navigate("/game")}
        onSkip={() => navigate("/game")}
      />
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
            variant="outline"
            size="sm"
            className="gap-1.5 border-border text-muted-foreground hover:text-foreground"
            disabled={!nameInput.trim()}
            onClick={() => {
              const trimmed = nameInput.trim();
              if (!trimmed) return;
              setPlayerName(trimmed);
              navigate("/game");
            }}
          >
            <SkipForward className="w-3.5 h-3.5" />
            跳过介绍，直接开始游戏
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
      <section className="relative flex-1 flex flex-col items-center justify-center text-center px-4 py-12 sm:py-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium mb-6">
            <Zap className="w-3 h-3" />
            EMBA 变革管理模拟 · 多人竞技版
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight">
            中国企业
            <span className="text-primary"> 出海变革</span>
            <br />
            模拟挑战
          </h1>

          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg mb-8 leading-relaxed">
            你被派往海外，执行一场组织整合。<br className="hidden sm:block" />
            在 60 个资源内，说服 12 位关键人物接受变革。<br className="hidden sm:block" />
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
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
