import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  ChevronLeft,
  SkipForward,
  Rocket,
  Users,
  MessageSquare,
  Target,
  Lightbulb,
  Lock,
  TrendingUp,
} from "lucide-react";

interface BriefingPageProps {
  playerName: string;
  onEnterGame: () => void;
  onSkip: () => void;
}

const TOTAL_SLIDES = 5;

// ── Slide content ──────────────────────────────────────────────────────────

function Slide1() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <Rocket className="w-5 h-5 text-primary" />
        </div>
        <span className="text-xs font-semibold tracking-widest text-primary uppercase">任务背景</span>
      </div>
      <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
        你被派往海外，<br />
        <span className="text-primary">执行一场组织整合。</span>
      </h2>
      <p className="text-muted-foreground text-base leading-relaxed">
        中国某制造业集团刚刚完成欧洲并购。总部任命你为<strong className="text-foreground">海外整合负责人</strong>，
        前往当地工厂推行新的治理体系与协同方式。
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
        {[
          { icon: "🏭", label: "欧洲工厂", desc: "刚被收购，文化差异显著" },
          { icon: "🤝", label: "12 位关键人物", desc: "各有立场，各有算盘" },
          { icon: "⏱️", label: "48 个资源单位", desc: "时间与精力的总预算" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-border bg-card/60 p-4 flex flex-col gap-1"
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="font-semibold text-sm">{item.label}</span>
            <span className="text-xs text-muted-foreground">{item.desc}</span>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground border-l-2 border-primary/40 pl-4 italic">
        你的目标：在资源耗尽之前，让尽可能多的人真正接受变革。
      </p>
    </div>
  );
}

function Slide2() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <span className="text-xs font-semibold tracking-widest text-primary uppercase">游戏规则</span>
      </div>
      <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
        每一回合，<br />
        <span className="text-primary">选择行动与目标。</span>
      </h2>
      <p className="text-muted-foreground text-base leading-relaxed">
        游戏分为多个回合。每回合你选择一个<strong className="text-foreground">行动类型</strong>和一个或多个<strong className="text-foreground">目标人物</strong>，
        消耗对应的资源，并观察结果。
      </p>
      <div className="rounded-xl border border-border bg-card/60 p-5 space-y-3">
        <div className="flex items-start gap-3">
          <span className="text-primary font-bold text-lg w-6 shrink-0">①</span>
          <div>
            <span className="font-semibold">选择行动</span>
            <p className="text-sm text-muted-foreground mt-0.5">每种行动消耗不同资源，效果也不同。</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-primary font-bold text-lg w-6 shrink-0">②</span>
          <div>
            <span className="font-semibold">选择目标人物</span>
            <p className="text-sm text-muted-foreground mt-0.5">12 位人物各有立场，选错目标可能适得其反。</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-primary font-bold text-lg w-6 shrink-0">③</span>
          <div>
            <span className="font-semibold">观察结果</span>
            <p className="text-sm text-muted-foreground mt-0.5">行动会影响可信度、压力值，以及人物的转化状态。</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-primary font-bold text-lg w-6 shrink-0">④</span>
          <div>
            <span className="font-semibold">资源耗尽，游戏结束</span>
            <p className="text-sm text-muted-foreground mt-0.5">48 个资源用完后，系统自动结算得分。</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Slide3() {
  const actions = [
    {
      icon: <MessageSquare className="w-4 h-4" />,
      name: "访谈",
      cost: "低",
      effect: "了解人物立场，发现隐藏信息",
      tip: "是发现阻力者身份的关键手段",
    },
    {
      icon: <Target className="w-4 h-4" />,
      name: "说服",
      cost: "中",
      effect: "提升目标人物的接受意愿",
      tip: "对中立或观望者效果最好",
    },
    {
      icon: <Users className="w-4 h-4" />,
      name: "联盟",
      cost: "中",
      effect: "借助支持者影响其他人物",
      tip: "利用社会网络扩大影响力",
    },
    {
      icon: <TrendingUp className="w-4 h-4" />,
      name: "培训",
      cost: "中高",
      effect: "提升人物能力与信心",
      tip: "对技术型人物尤为有效",
    },
    {
      icon: <Lock className="w-4 h-4" />,
      name: "约谈",
      cost: "高",
      effect: "直接施压阻力者",
      tip: "需先通过访谈发现阻力者身份",
    },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <Target className="w-5 h-5 text-primary" />
        </div>
        <span className="text-xs font-semibold tracking-widest text-primary uppercase">行动类型</span>
      </div>
      <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
        五种行动，<br />
        <span className="text-primary">各有用武之地。</span>
      </h2>
      <div className="space-y-2">
        {actions.map((a) => (
          <div
            key={a.name}
            className="flex items-start gap-3 rounded-lg border border-border bg-card/50 px-4 py-3"
          >
            <div className="w-7 h-7 rounded-md bg-primary/15 flex items-center justify-center shrink-0 mt-0.5 text-primary">
              {a.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">{a.name}</span>
                <span className="text-xs text-muted-foreground bg-muted/40 rounded px-1.5 py-0.5">
                  消耗：{a.cost}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{a.effect}</p>
              <p className="text-xs text-primary/80 mt-0.5 italic">💡 {a.tip}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Slide4() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
          <Lightbulb className="w-5 h-5 text-amber-400" />
        </div>
        <span className="text-xs font-semibold tracking-widest text-amber-400 uppercase">关键提示</span>
      </div>
      <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
        有些真相，<br />
        <span className="text-amber-400">需要你主动发现。</span>
      </h2>

      {/* Discovery mechanic */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-amber-300 text-sm">阻力者身份是隐藏的</span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          部分人物表面上看起来中立，实则对变革持有隐藏的阻力立场。
          你需要通过<strong className="text-foreground">访谈本人或其关联人物</strong>，才能发现其真实身份。
          在发现之前，你无法对其使用"约谈"行动。
        </p>
        <div className="flex items-center gap-2 text-xs text-amber-400/80 bg-amber-500/10 rounded-lg px-3 py-2">
          🔍 社会网络图中，未发现的阻力者不会显示阻力标记。
        </div>
      </div>

      {/* Scoring formula */}
      <div className="rounded-xl border border-border bg-card/60 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">得分公式</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap text-sm font-mono">
          <span className="bg-primary/10 border border-primary/30 rounded px-2 py-1 text-primary">转化率</span>
          <span className="text-muted-foreground">×</span>
          <span className="bg-green-500/10 border border-green-500/30 rounded px-2 py-1 text-green-400">健康度指数</span>
          <span className="text-muted-foreground">×</span>
          <span className="bg-muted/30 border border-border rounded px-2 py-1">100</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">转化率</strong> = 成功转化人数 / 12 人。
          <strong className="text-foreground"> 健康度</strong> = 可信度与压力值的综合表现。
          转化越多、组织越健康，得分越高。
        </p>
      </div>
    </div>
  );
}

function Slide5({ playerName }: { playerName: string }) {
  return (
    <div className="flex flex-col items-center gap-6 max-w-2xl mx-auto text-center">
      <div className="text-6xl mb-2">🚀</div>
      <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
        出发，
        <span className="text-primary"> {playerName || "出海负责人"}</span>。
      </h2>
      <p className="text-muted-foreground text-base leading-relaxed max-w-md">
        你已了解任务背景与规则。接下来，进入模拟，
        在 48 个资源内做出你的决策，看看你能让多少人真正接受变革。
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg mt-2">
        {[
          { emoji: "🔍", text: "先访谈，了解人物" },
          { emoji: "🤝", text: "建联盟，扩大影响" },
          { emoji: "🎯", text: "精准施策，高效转化" },
        ].map((tip) => (
          <div
            key={tip.text}
            className="rounded-lg border border-border bg-card/50 px-3 py-3 text-sm text-muted-foreground"
          >
            <span className="text-base mr-1">{tip.emoji}</span>
            {tip.text}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function BriefingPage({ playerName, onEnterGame, onSkip }: BriefingPageProps) {
  const [slide, setSlide] = useState(1);

  const goNext = useCallback(() => {
    if (slide < TOTAL_SLIDES) setSlide((s) => s + 1);
    else onEnterGame();
  }, [slide, onEnterGame]);

  const goPrev = useCallback(() => {
    if (slide > 1) setSlide((s) => s - 1);
  }, [slide]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); goNext(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  const isLast = slide === TOTAL_SLIDES;

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50 shrink-0">
        <div className="text-sm text-muted-foreground">
          任务简报 · <span className="text-primary font-medium">{playerName}</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress dots */}
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_SLIDES }, (_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i + 1)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i + 1 === slide
                    ? "bg-primary w-4"
                    : i + 1 < slide
                    ? "bg-primary/50"
                    : "bg-muted"
                }`}
                aria-label={`跳转到第 ${i + 1} 页`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {slide} / {TOTAL_SLIDES}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-muted-foreground hover:text-foreground text-xs"
            onClick={onSkip}
          >
            <SkipForward className="w-3.5 h-3.5" />
            跳过说明
          </Button>
        </div>
      </div>

      {/* Slide content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8">
        <div key={slide} className="animate-in fade-in slide-in-from-right-4 duration-300">
          {slide === 1 && <Slide1 />}
          {slide === 2 && <Slide2 />}
          {slide === 3 && <Slide3 />}
          {slide === 4 && <Slide4 />}
          {slide === 5 && <Slide5 playerName={playerName} />}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 border-t border-border bg-card/50 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          onClick={goPrev}
          disabled={slide === 1}
        >
          <ChevronLeft className="w-4 h-4" />
          上一页
        </Button>

        <Button
          size="sm"
          className={`gap-1.5 ${
            isLast
              ? "bg-primary hover:bg-primary/90 text-primary-foreground px-6"
              : "bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30"
          }`}
          onClick={goNext}
        >
          {isLast ? (
            <>
              <Rocket className="w-4 h-4" />
              开始模拟
            </>
          ) : (
            <>
              下一页
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
