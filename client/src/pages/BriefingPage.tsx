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

      {/* Conversion stage diagram */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <p className="text-xs font-semibold text-primary mb-3 uppercase tracking-widest">人物转化路径</p>
        <div className="flex items-center gap-1 flex-wrap justify-between">
          {[
            { label: "未动", glyph: "○", color: "text-muted-foreground", bg: "bg-muted/30 border-muted" },
            { label: "意识觉醒", glyph: "◔", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/30" },
            { label: "初步理解", glyph: "◑", color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/30" },
            { label: "主动参与", glyph: "◕", color: "text-lime-400", bg: "bg-lime-400/10 border-lime-400/30" },
            { label: "已转化", glyph: "●", color: "text-primary", bg: "bg-primary/15 border-primary/40" },
          ].map((s, i, arr) => (
            <>
              <div
                key={s.label}
                className={`flex flex-col items-center gap-1 rounded-lg border px-2.5 py-2 min-w-[52px] ${s.bg}`}
              >
                <span className={`text-xl font-bold leading-none ${s.color}`}>{s.glyph}</span>
                <span className={`text-[10px] font-semibold ${s.color}`}>{s.label}</span>
              </div>
              {i < arr.length - 1 && (
                <span key={`arrow-${i}`} className="text-muted-foreground text-sm shrink-0">→</span>
              )}
            </>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
          每个人物都从「未动」开始。行动效果会推动人物逐步升阶；错误行动或过高压力也可能导致回退。得分取决于最终转化率与组织健康度。
        </p>
      </div>
    </div>
  );
}

function Slide3() {
  // Actual actions from the game engine, grouped by category
  const groups = [
    {
      label: "🌱 建立信任",
      color: "border-primary/30 bg-primary/5",
      actions: [
        { name: "以身作则", cost: "2 资源", type: "示范", desc: "先用行动建立可信度，再推动别人。早期信号最强，后期递减但维持可信度。" },
        { name: "争取总部公开背书", cost: "2 资源", type: "政治", desc: "通过公开支持提升你的正当性。反复求背书会消耗政治资本。" },
        { name: "休闲聚会", cost: "1 资源", type: "关系", desc: "饭局、喝酒——在非正式场合建立信任。可邀请 1–6 人，消耗 1 资源。已转化同事参与时口碑扩散至其关系邻居。第5次起效果打折，可信度受损。" },
      ],
    },
    {
      label: "💬 对话与沟通",
      color: "border-cyan-500/30 bg-cyan-500/5",
      actions: [
        { name: "私人访谈", cost: "2 资源", type: "对话", desc: "深度一对一对话，一次访谈即可全面解锁对方的动作偏好与隐藏关系网络。每次访谈 1 人，冷却 3 回合。" },
        { name: "间接打听", cost: "1 资源", type: "对话", desc: "通过非正式渠道侧面了解公开态度。范围广（1–4人）、成本低，但只能了解表面立场，无法解锁偏好或隐藏关系。" },
        { name: "发布组织邮件", cost: "1 资源", type: "沟通", desc: "广播工具，一次覆盖所有未转化者。第3次起产生邮件疲劳，效果大幅下降。" },
        { name: "发布阶段进展", cost: "2 资源", type: "沟通", desc: "让观望者看到变革正在推进。成果不足时发布会损害可信度。" },
      ],
    },
    {
      label: "🎓 赋能与验证",
      color: "border-green-500/30 bg-green-500/5",
      actions: [
        { name: "外部培训", cost: "3 资源", type: "赋能", desc: "引入外部顾问或高校讲师进行专业培训。早期新鲜感强（+14），后期效果递减（+8）。需选 3 人参与。" },
        { name: "内部培训", cost: "2 资源", type: "赋能", desc: "内部师傅带领培训，帮助员工掌握实际技能。早期员工尚未准备好，效果有限（+8）；后期对有意愿者效果显著（+15）。需选 3 人参与。" },
        { name: "小范围试点", cost: "3 资源", type: "验证", desc: "把变革变成可见的实际成果，说服「眼见为实」的人。需选 3 人参与。" },
        { name: "讲述成功案例", cost: "1 资源", type: "叙事", desc: "用真实案例激励目标。第3–4次降至半效，第5次起效果大幅递减。需选 2 人。" },
      ],
    },
    {
      label: "🏆 认可与压力",
      color: "border-amber-500/30 bg-amber-500/5",
      actions: [
        { name: "公开认可示范者", cost: "2 资源", type: "政治", desc: "公开表彰已参与者，放大示范效应。对尚未参与的人使用会引发全组织质疑。" },
        { name: "宣布KPI与时限", cost: "2 资源", type: "压力", desc: "制造紧迫感，但会明显提升组织压力。信誉不足时使用会引发反弹。" },
        { name: "调整激励与奖惩", cost: "3 资源", type: "制度", desc: "制度推力：对未动者信号有限（+10），对初步理解者最有效（+18），对参与者直接突破（+18）。需要极高政治资本（可信度≥9）。" },
      ],
    },
    {
      label: "⚡ 对抗纠偏",
      color: "border-red-500/30 bg-red-500/5",
      actions: [
        { name: "强硬约谈阻力者", cost: "1 资源", type: "对抗", desc: "对核心阻力者施压，强制其被迫妥协，但关系邻居会产生寒蝉效应（-3）。用错对象会严重损害可信度。" },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <Target className="w-5 h-5 text-primary" />
        </div>
        <span className="text-xs font-semibold tracking-widest text-primary uppercase">行动类型</span>
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold leading-tight">
        14 种行动，<br />
        <span className="text-primary">按策略阶段选择。</span>
      </h2>
      <div className="space-y-3 overflow-y-auto max-h-[55vh] pr-1">
        {groups.map((g) => (
          <div key={g.label} className={`rounded-xl border p-3 ${g.color}`}>
            <div className="text-xs font-semibold mb-2 text-foreground/80">{g.label}</div>
            <div className="space-y-2">
              {g.actions.map((a) => (
                <div key={a.name} className="flex flex-col gap-0.5">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="font-semibold text-xs text-foreground">{a.name}</span>
                    <span className="text-[10px] text-muted-foreground bg-muted/40 rounded px-1 shrink-0">{a.type} · {a.cost}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{a.desc}</p>
                </div>
              ))}
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
