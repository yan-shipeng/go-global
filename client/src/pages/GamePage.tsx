import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogIn, Trophy, RotateCcw, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

const GAME_ENGINE_URL = "/manus-storage/game-engine_97acc408.html";

interface GameResult {
  endingType: string;
  won: boolean;
  convertedCount: number;
  totalPeople: number;
  resourcesLeft: number;
  finalCred: number;
  finalPressure: number;
  totalRounds: number;
  baseScore: number;
  efficiencyScore: number;
  healthScore: number;
  bonusScore: number;
  totalScore: number;
  history: unknown[];
}

interface TurnData {
  round: number;
  actionId: string;
  actionLabel: string;
  targets: string[];
  prediction: string;
  deltas: { cred: number; pressure: number; converted: number };
  credAfter: number;
  pressureAfter: number;
  weeksLeft: number;
}

export default function GamePage() {
  const { user, isAuthenticated, loading } = useAuth();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [iframeKey, setIframeKey] = useState(0);

  const startSession = trpc.game.startSession.useMutation();
  const saveTurnMutation = trpc.game.saveTurn.useMutation();
  const endSession = trpc.game.endSession.useMutation();

  // Inject player name once iframe loads
  const handleIframeLoad = () => {
    if (!iframeRef.current || !user) return;
    setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage(
        { type: "SET_PLAYER", name: user.name || "玩家" },
        "*"
      );
    }, 600);
  };

  // Start a new game session
  const handleStartGame = async () => {
    if (!user) return;
    try {
      const session = await startSession.mutateAsync({});
      setSessionId(session.sessionId);
      setGameResult(null);
      setIframeKey(k => k + 1);
    } catch {
      toast.error("无法创建游戏会话，请重试");
    }
  };

  // Listen for postMessage from game engine
  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      if (!event.data?.type) return;

      if (event.data.type === "GAME_TURN" && sessionId !== null) {
        const turn = event.data.turn as TurnData;
        try {
          await saveTurnMutation.mutateAsync({
            sessionId,
            round: turn.round,
            actionId: turn.actionId,
            actionLabel: turn.actionLabel,
            targets: turn.targets,
            prediction: turn.prediction,
            credibilityAfter: turn.credAfter,
            pressureAfter: turn.pressureAfter,
            resourcesAfter: turn.weeksLeft,
            outcome: turn.deltas.converted > 0 ? "success" : "partial",
          });
        } catch {
          // Non-blocking
        }
      }

      if (event.data.type === "GAME_ENDED" && sessionId !== null) {
        const result = event.data.result as GameResult;
        setGameResult(result);
        try {
          await endSession.mutateAsync({
            sessionId,
            status: result.won ? "win" : "fail",
            resourcesLeft: result.resourcesLeft,
            finalCredibility: result.finalCred,
            finalPressure: result.finalPressure,
            convertedCount: result.convertedCount,
            totalRounds: result.totalRounds,
          });
          if (result.won) {
            toast.success(`🎉 通关！综合得分 ${result.totalScore} 分`);
          } else {
            toast.error("任务失败，再接再厉！");
          }
        } catch {
          toast.error("保存游戏记录失败");
        }
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">需要登录</h2>
          <p className="text-muted-foreground">请先登录以开始游戏并保存您的成绩</p>
        </div>
        <Button
          size="lg"
          className="gap-2 bg-primary hover:bg-primary/90"
          onClick={() => { window.location.href = getLoginUrl(); }}
        >
          <LogIn className="w-4 h-4" />
          登录后开始游戏
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] relative">
      {/* Game toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">👤 {user?.name ?? "玩家"}</span>
          {sessionId !== null && (
            <Badge variant="outline" className="text-xs text-primary border-primary/30">
              游戏进行中
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {sessionId === null ? (
            <Button
              size="sm"
              className="gap-1.5 bg-primary hover:bg-primary/90"
              onClick={handleStartGame}
              disabled={startSession.isPending}
            >
              {startSession.isPending ? "创建中..." : "🚀 开始新游戏"}
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={handleStartGame}>
              <RotateCcw className="w-3.5 h-3.5" />
              重新开始
            </Button>
          )}
          <Link href="/leaderboard">
            <Button size="sm" variant="ghost" className="gap-1.5">
              <Trophy className="w-3.5 h-3.5" />
              排行榜
            </Button>
          </Link>
        </div>
      </div>

      {/* Game result overlay */}
      {gameResult && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4 bg-card border-border shadow-2xl">
            <CardHeader className="text-center pb-2">
              {gameResult.won ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-12 h-12 text-green-400" />
                  <CardTitle className="text-2xl text-green-400">任务完成！</CardTitle>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <XCircle className="w-12 h-12 text-destructive" />
                  <CardTitle className="text-2xl text-destructive">任务失败</CardTitle>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <div className="text-center mb-3">
                  <div className="text-4xl font-bold text-primary">{gameResult.totalScore}</div>
                  <div className="text-sm text-muted-foreground">综合得分</div>
                </div>
                {[
                  { label: "基础分", value: String(gameResult.baseScore), color: "text-foreground" },
                  { label: "效率分", value: `+${gameResult.efficiencyScore.toFixed(1)}`, color: "text-primary" },
                  { label: "健康度分", value: `${gameResult.healthScore >= 0 ? "+" : ""}${gameResult.healthScore.toFixed(1)}`, color: gameResult.healthScore >= 0 ? "text-green-400" : "text-destructive" },
                  { label: "超额转化分", value: `+${gameResult.bonusScore}`, color: "text-yellow-400" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className={`font-mono font-semibold ${color}`}>{value}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                {[
                  { label: "转化人数", value: `${gameResult.convertedCount}/${gameResult.totalPeople}` },
                  { label: "剩余资源", value: String(gameResult.resourcesLeft) },
                  { label: "共用回合", value: String(gameResult.totalRounds) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-muted/20 rounded p-2">
                    <div className="font-semibold">{value}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleStartGame}>
                  <RotateCcw className="w-4 h-4 mr-1.5" />
                  再玩一局
                </Button>
                <Link href="/leaderboard" className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Trophy className="w-4 h-4 mr-1.5" />
                    查看排名
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Game iframe or start prompt */}
      {sessionId !== null ? (
        <iframe
          key={iframeKey}
          ref={iframeRef}
          src={GAME_ENGINE_URL}
          className="flex-1 w-full border-none"
          onLoad={handleIframeLoad}
          title="中国企业出海变革模拟"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🚀</div>
            <h2 className="text-2xl font-bold mb-2">准备出发</h2>
            <p className="text-muted-foreground mb-6">
              点击「开始新游戏」创建一局新的游戏记录。<br />
              游戏结束后，成绩将自动保存到排行榜。
            </p>
            <Button
              size="lg"
              className="gap-2 bg-primary hover:bg-primary/90"
              onClick={handleStartGame}
              disabled={startSession.isPending}
            >
              {startSession.isPending ? "创建中..." : "🚀 开始新游戏"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
