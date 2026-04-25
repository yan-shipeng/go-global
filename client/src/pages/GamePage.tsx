import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, RotateCcw, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { usePlayerName } from "@/hooks/usePlayerName";

const GAME_ENGINE_URL = "/manus-storage/game-engine_a421e147.html?autoStart=1";

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
  conversionScore: number;
  healthScore: number;
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
  const { playerName } = usePlayerName();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  // Overlay: null = not started, false = visible/loading, true = game ready (fading out)
  const [gameReady, setGameReady] = useState<boolean | null>(null);

  const startSession = trpc.game.startSession.useMutation();
  const saveTurnMutation = trpc.game.saveTurn.useMutation();
  const endSession = trpc.game.endSession.useMutation();

  // Inject player name once iframe loads and immediately skip the engine's own intro screen
  const handleIframeLoad = () => {
    if (!iframeRef.current || !playerName) return;
    const win = iframeRef.current.contentWindow;
    if (!win) return;
    // Send SET_PLAYER first (fills the name field in the engine)
    win.postMessage({ type: "SET_PLAYER", name: playerName }, "*");
    // Then immediately skip the intro screen — no delay needed
    win.postMessage({ type: "SKIP_INTRO" }, "*");
  };

  // Start a new game session
  const handleStartGame = async (name?: string) => {
    const activeName = name ?? playerName;
    if (!activeName) return;
    try {
      const session = await startSession.mutateAsync({ playerName: activeName });
      setSessionId(session.sessionId);
      setGameResult(null);
      setGameReady(false); // Reset overlay — hide iframe until GAME_READY
      setIframeKey(k => k + 1);
      // Small delay to ensure overlay is fully opaque before iframe starts loading
      await new Promise(r => setTimeout(r, 50));
    } catch {
      toast.error("无法创建游戏会话，请重试");
    }
  };

  // Listen for postMessage from game engine
  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      if (!event.data?.type) return;

      // Game engine signals it has fully rendered the main UI
      if (event.data.type === "GAME_READY") {
        setGameReady(true); // triggers CSS fade-out transition
        return;
      }

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
          toast.success(`🎮 游戏结束！综合得分 ${result.totalScore} 分`);
        } catch {
          toast.error("保存游戏记录失败");
        }
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [sessionId]);

  // If no name set, redirect back to home to enter name
  if (!playerName) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] gap-4 px-4">
        <p className="text-muted-foreground">请先在首页输入你的名字</p>
        <Link href="/">
          <Button className="bg-primary hover:bg-primary/90">返回首页</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] relative">
      {/* Game toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
            <UserRound className="w-3.5 h-3.5 text-primary" />
            {playerName}
          </span>
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
              onClick={() => handleStartGame()}
              disabled={startSession.isPending}
            >
              {startSession.isPending ? "创建中..." : "🚀 开始新游戏"}
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleStartGame()}>
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
              <div className="flex flex-col items-center gap-2">
                <Trophy className="w-12 h-12 text-primary" />
                <CardTitle className="text-2xl text-foreground">游戏结束 · 复盘时刻</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <div className="text-center mb-3">
                  <div className="text-4xl font-bold text-primary">{gameResult.totalScore}</div>
                  <div className="text-sm text-muted-foreground">综合得分（满分 100）</div>
                </div>
                {/* Multiplicative formula breakdown */}
                <div className="flex items-center justify-center gap-2 text-sm flex-wrap">
                  <div className="text-center px-3 py-1.5 rounded bg-primary/10 border border-primary/30">
                    <div className="text-xs text-muted-foreground mb-0.5">转化率</div>
                    <div className="font-mono font-semibold text-primary">
                      {gameResult.convertedCount}/{gameResult.totalPeople}
                      <span className="text-xs ml-1 opacity-70">= {Math.round(gameResult.convertedCount / gameResult.totalPeople * 100)}%</span>
                    </div>
                  </div>
                  <span className="text-muted-foreground font-light text-lg">×</span>
                  <div className="text-center px-3 py-1.5 rounded bg-green-500/10 border border-green-500/30">
                    <div className="text-xs text-muted-foreground mb-0.5">健康度指数</div>
                    <div className="font-mono font-semibold text-green-400">
                      {gameResult.healthScore}%
                      <span className="text-xs ml-1 opacity-70">(可信{gameResult.finalCred}−压{gameResult.finalPressure})</span>
                    </div>
                  </div>
                  <span className="text-muted-foreground font-light text-lg">×</span>
                  <div className="text-center px-3 py-1.5 rounded bg-muted/30 border border-border">
                    <div className="text-xs text-muted-foreground mb-0.5">满分</div>
                    <div className="font-mono font-semibold">100</div>
                  </div>
                </div>
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
                <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={() => handleStartGame()}>
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
        <div className="flex-1 relative">
          {/* Opaque loading overlay — hides the iframe until GAME_READY is received */}
          {gameReady !== null && (
            <div
              className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 transition-opacity duration-500"
              style={{
                background: "var(--background)",
                opacity: gameReady ? 0 : 1,
                pointerEvents: gameReady ? "none" : "auto",
              }}
            >
              {/* Spinner */}
              <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <p className="text-sm text-muted-foreground">正在加载游戏…</p>
            </div>
          )}
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={GAME_ENGINE_URL}
            className="w-full h-full border-none"
            onLoad={handleIframeLoad}
            title="中国企业出海变革模拟"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🚀</div>
            <h2 className="text-2xl font-bold mb-2">准备出发，{playerName}</h2>
            <p className="text-muted-foreground mb-6">
              点击「开始新游戏」创建一局新的游戏记录。<br />
              游戏结束后，成绩将自动保存到排行榜。
            </p>
            <Button
              size="lg"
              className="gap-2 bg-primary hover:bg-primary/90"
              onClick={() => handleStartGame()}
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
