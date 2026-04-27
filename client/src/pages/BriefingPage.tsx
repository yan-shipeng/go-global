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
          { icon: "⏱️", label: "60 个资源单位", desc: "时间与精力的总预算" },
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
            <p className="text-sm text-muted-foreground mt-0.5">60 个资源用完后，系统自动结算得分。</p>
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
      label: "💬 沟通",
      color: "border-cyan-500/30 bg-cyan-500/5",
      actions: [
        { name: "私人访谈", cost: "2 资源", type: "沟通", desc: "深度私人对话，一次访谈即可全面解锁对方的动作偏好与隐藏关系网络（休闲聚会也能部分揭露隐藏关系）。每次可访谈一至两人，但同时约谈两人时每人获得的深度关注相对减少，推进效果略低于单独访谈。对同一人过度访谈会显得烦人，引发反感。有冷却期。" },
        { name: "发布组织邮件", cost: "1 资源", type: "沟通", desc: "广播工具，一次覆盖所有未转化者，但说服深度随阶段递减。多次使用后收件人容易产生邮件疲劳，效果大幅下降。" },
        { name: "发布阶段进展", cost: "2 资源", type: "沟通", desc: "让观望者看到变革正在推进。成果越扎实，效果越好；成果不足时发布，实干派会反感，可信度也会受损。" },
        { name: "休闲聚会", cost: "3 资源", type: "沟通", desc: "饭局、喝酒——在非正式场合建立信任。每次最多邀请四人，有冷却期。对已有初步理解的人效果显著；参与者之间若有正式关系，效果额外增强；有已转化同事参与时，口碑扩散至其关系邻居，效果更强，还可自然了解参与者之间的关系网络。过度使用后效果打折，可信度受损。" },
      ],
      note: "💡 解锁隐藏关系：私人访谈（完整解锁）或休闲聚会（意外揭露）",
    },
    {
      label: "🌱 示范",
      color: "border-primary/30 bg-primary/5",
      actions: [
        { name: "以身作则", cost: "2 资源", type: "示范", desc: "先用行动建立可信度，再推动别人。变革早期信号最强，随着更多人转化后效果逐渐递减，但始终有助于维持可信度。连续重复使用而中间没有其他动作，信号会退化为作秀，效果打折。" },
        { name: "讲述成功案例", cost: "1 资源", type: "示范", desc: "用真实案例激励目标，强化变革可行性的信念。没有任何转化成果时强行讲故事，听众会主动抵触。反复讲述同类案例会产生故事疲劳，多次使用后效果递减。" },
        { name: "小范围试点", cost: "3 资源", type: "示范", desc: "把抽象的变革要求变成可以看得见、摸得着的实际成果，最能说服眼见为实的人，扩散效果强。需选定若干参与者。" },
      ],
    },
    {
      label: "🎓 赋能",
      color: "border-green-500/30 bg-green-500/5",
      actions: [
        { name: "外部培训", cost: "3 资源", type: "赋能", desc: "引入外部顾问或高校讲师进行专业培训。变革早期新鲜感强，效果显著；后期员工已有先入为主，新鲜感递减。需选定若干参与者。" },
        { name: "内部培训", cost: "2 资源", type: "赋能", desc: "内部师傅带领培训，帮助员工掌握实际操作技能。变革早期员工尚未做好准备，效果相对有限；后期对已有意愿者效果显著。需选定若干参与者。" },
      ],
    },
    {
      label: "🏛 制度",
      color: "border-amber-500/30 bg-amber-500/5",
      actions: [
        { name: "争取总部公开背书", cost: "2 资源", type: "制度", desc: "通过公开支持提升你的正当性。首次背书信号最强；反复求背书会逐渐消耗与CEO的政治资本，边际效果递减。" },
        { name: "公开认可示范者", cost: "2 资源", type: "制度", desc: "公开表彰有实际成果的人，放大示范效应。目标必须已处于参与状态或以上；表彰火候未到的人会引发全组织质疑。" },
        { name: "宣布KPI与时限", cost: "2 资源", type: "制度", desc: "能制造紧迫感，但组织也会感到压力。若你的信誉尚未建立且缺乏真实成果，硬推KPI会被认为是蛮干而引发反弹。" },
        { name: "调整激励与奖惩", cost: "5 资源", type: "制度", desc: "通过制度改变推动全体。对尚未形成意愿的人，制度信号有限；对已有初步理解的人，制度推力最有效；对已参与者，可直接突破最后一跳。需要极高的政治资本才能推行，但代价是会明显提升组织压力。" },
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
        13 种行动，<br />
        <span className="text-primary">4 大类别，按情境选择。</span>
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
            {g.note && (
              <div className="mt-2 px-2 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-cyan-400 leading-relaxed">
                {g.note}
              </div>
            )}
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
          你需要通过<strong className="text-foreground">私人访谈或休闲聚会</strong>，才能发现其真实身份。
          在发现之前，你无法对其使用"约谈"行动。
        </p>
        <div className="flex items-center gap-2 text-xs text-amber-400/80 bg-amber-500/10 rounded-lg px-3 py-2">
          🔍 社会网络图中，未发现的阻力者不会显示阻力标记。
        </div>
      </div>

      {/* Strategy visibility tip */}
      <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-cyan-300 text-sm">策略选择是公开的</span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          <strong className="text-foreground">制度类动作</strong>（争取背书、宣布 KPI、调整激励）见效快但消耗大，且对部分人物有强烈负向影响； 
          <strong className="text-foreground">沟通类动作</strong>（私人访谈、休闲聚会、发布邮件）建立基础但需要时间。
          游戏结束后，你的<strong className="text-foreground">策略偏向</strong>（制度主导 / 沟通主导 / 均衡型）将在排行榜中公开显示。
        </p>
        <div className="flex items-center gap-2 text-xs text-cyan-400/80 bg-cyan-500/10 rounded-lg px-3 py-2">
          📊 排行榜中可看到每位玩家的策略偏向，课堂复盘时可直接对比不同路径的得分差异。
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
        在 60 个资源内做出你的决策，看看你能让多少人真正接受变革。
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg mt-2">
        {[
          { emoji: "🔍", text: "访谈或聚会，了解人物" },
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
