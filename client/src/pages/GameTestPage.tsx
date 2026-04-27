/**
 * HIDDEN TEST PAGE — /game-test
 * Not linked in navigation. For rapid QA testing only.
 *
 * Features:
 *  - "⚡ 一键全转化" button: sends CHEAT_WIN to the engine iframe → all 12 people
 *    instantly converted → game ends → PostGameSummary shows.
 *  - "🔁 重置游戏" button: restarts the session (same as the normal restart flow).
 *  - Shows live DB status: whether startSession / endSession succeeded.
 */

import React, { useRef, useState, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trophy, RotateCcw, Zap, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { usePlayerName } from "@/hooks/usePlayerName";

const GAME_ENGINE_URL = "/manus-storage/game-engine_6c9b6e49.html?autoStart=1";
const SESSION_ID_KEY = "china-outbound-test-session-id";

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
  aggressiveIndex?: number;
  conservativeIndex?: number;
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

type LogEntry = { ts: string; msg: string; ok: boolean };

export default function GameTestPage() {
  const { playerName, setPlayerName } = usePlayerName();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [sessionId, setSessionIdState] = useState<number | null>(() => {
    try { const s = localStorage.getItem(SESSION_ID_KEY); return s ? Number(s) : null; } catch { return null; }
  });
  const setSessionId = useCallback((id: number | null) => {
    setSessionIdState(id);
    try { id != null ? localStorage.setItem(SESSION_ID_KEY, String(id)) : localStorage.removeItem(SESSION_ID_KEY); } catch {}
  }, []);

  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [gameReady, setGameReady] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [cheatSent, setCheatSent] = useState(false);

  const sessionIdRef = useRef<number | null>(sessionId);
  const addLog = useCallback((msg: string, ok: boolean) => {
    const ts = new Date().toLocaleTimeString("zh-CN");
    setLog(prev => [{ ts, msg, ok }, ...prev.slice(0, 19)]);
  }, []);

  const startSession = trpc.game.startSession.useMutation();
  const saveTurnMutation = trpc.game.saveTurn.useMutation();
  const endSession = trpc.game.endSession.useMutation();
  const endSessionRef = useRef(endSession.mutateAsync);
  const saveTurnRef = useRef(saveTurnMutation.mutateAsync);
  useEffect(() => { endSessionRef.current = endSession.mutateAsync; });
  useEffect(() => { saveTurnRef.current = saveTurnMutation.mutateAsync; });

  const testPlayerName = playerName || "测试玩家";

  const handleStartGame = useCallback(async () => {
    try {
      addLog("调用 startSession…", true);
      const session = await startSession.mutateAsync({ playerName: testPlayerName });
      const newId = session.sessionId;
      setSessionId(newId);
      sessionIdRef.current = newId;
      setGameResult(null);
      setGameReady(false);
      setCheatSent(false);
      setIframeKey(k => k + 1);
      addLog(`✅ startSession OK → sessionId=${newId}`, true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addLog(`❌ startSession FAILED: ${msg}`, false);
      toast.error("创建会话失败：" + msg);
    }
  }, [testPlayerName, startSession, setSessionId, addLog]);

  const handleIframeLoad = () => {
    if (!iframeRef.current) return;
    const win = iframeRef.current.contentWindow;
    if (!win) return;
    win.postMessage({ type: "SET_PLAYER", name: testPlayerName }, "*");
    win.postMessage({ type: "SKIP_INTRO" }, "*");
    addLog("iframe loaded → SET_PLAYER + SKIP_INTRO sent", true);
  };

  const sendCheatWin = () => {
    if (!iframeRef.current?.contentWindow) {
      addLog("❌ iframe not ready", false);
      return;
    }
    iframeRef.current.contentWindow.postMessage({ type: "CHEAT_WIN" }, "*");
    setCheatSent(true);
    addLog("⚡ CHEAT_WIN sent to engine", true);
  };

  const sendSetResources = () => {
    if (!iframeRef.current?.contentWindow) {
      addLog("❌ iframe not ready", false);
      return;
    }
    iframeRef.current.contentWindow.postMessage({ type: "SET_RESOURCES", value: 2 }, "*");
    addLog("💰 SET_RESOURCES=2 sent to engine", true);
  };

  const handleMessage = useCallback(async (event: MessageEvent) => {
    if (!event.data?.type) return;
    if (event.data.type === "GAME_READY") {
      setGameReady(true);
      addLog("✅ GAME_READY received", true);
      return;
    }
    const sid = sessionIdRef.current;
    if (event.data.type === "GAME_TURN" && sid !== null) {
      const turn = event.data.turn as TurnData;
      try {
        await saveTurnRef.current({
          sessionId: sid,
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
        addLog(`✅ GAME_TURN R${turn.round} saved`, true);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        addLog(`❌ saveTurn R${turn.round} FAILED: ${msg}`, false);
      }
    }
    if (event.data.type === "GAME_ENDED") {
      const result = event.data.result as GameResult;
      addLog(`📨 GAME_ENDED received — score=${result.totalScore}, converted=${result.convertedCount}/${result.totalPeople}`, true);
      setGameResult(result);
      if (sid !== null) {
        try {
          await endSessionRef.current({
            sessionId: sid,
            status: result.won ? "win" : "fail",
            resourcesLeft: Number(result.resourcesLeft) || 0,
            finalCredibility: Number(result.finalCred) || 0,
            finalPressure: Number(result.finalPressure) || 0,
            convertedCount: Number(result.convertedCount) || 0,
            totalRounds: Number(result.totalRounds) || 0,
            totalScore: Number(result.totalScore) || 0,
            baseScore: Number(result.baseScore) || 0,
            healthScore: Number(result.healthScore) || 0,
            aggressiveIndex: Number(result.aggressiveIndex) || 0,
            conservativeIndex: Number(result.conservativeIndex) || 0,
          });
          addLog(`✅ endSession OK → score=${result.totalScore} saved to DB`, true);
          toast.success(`✅ 测试完成！得分 ${result.totalScore}，记录已保存`);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          addLog(`❌ endSession FAILED: ${msg}`, false);
          toast.error("endSession 失败：" + msg);
        }
      } else {
        addLog("⚠️ GAME_ENDED but sessionId is null — not saved", false);
      }
    }
  }, [addLog]);

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
        <div className="text-lg font-bold text-primary">🧪 隐藏测试页</div>
        <Badge variant="outline" className="text-xs text-amber-400 border-amber-500/30 bg-amber-500/10">
          仅供内部测试
        </Badge>
        <div className="ml-auto text-xs text-muted-foreground">
          /game-test — 不在导航中显示
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-120px)]">
        {/* Left: game iframe */}
        <div className="flex flex-col gap-3">
          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <input
              className="flex-1 min-w-[140px] px-3 py-1.5 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground"
              placeholder="测试玩家名"
              defaultValue={testPlayerName}
              onBlur={e => { if (e.target.value) setPlayerName(e.target.value); }}
            />
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 gap-1.5"
              onClick={handleStartGame}
              disabled={startSession.isPending}
            >
              {startSession.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              {sessionId ? "重置游戏" : "开始游戏"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
              onClick={sendCheatWin}
              disabled={!gameReady || cheatSent}
            >
              <Zap className="w-3.5 h-3.5" />
              ⚡ 一键全转化
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
              onClick={sendSetResources}
              disabled={!gameReady}
            >
              💰 资源→2
            </Button>
          </div>

          {/* Status badges */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-muted-foreground">会话：</span>
            {sessionId != null
              ? <Badge variant="outline" className="text-green-400 border-green-500/30 bg-green-500/10">#{sessionId}</Badge>
              : <Badge variant="outline" className="text-muted-foreground">未创建</Badge>}
            <span className="text-muted-foreground ml-2">引擎：</span>
            {gameReady
              ? <Badge variant="outline" className="text-green-400 border-green-500/30 bg-green-500/10">就绪</Badge>
              : <Badge variant="outline" className="text-muted-foreground">等待中</Badge>}
            {gameResult && (
              <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10">
                <Trophy className="w-3 h-3 mr-1" />
                {gameResult.totalScore} 分
              </Badge>
            )}
          </div>

          {/* iframe */}
          {sessionId !== null ? (
            <div className="flex-1 rounded-xl border border-border overflow-hidden bg-card">
              <iframe
                key={iframeKey}
                ref={iframeRef}
                src={GAME_ENGINE_URL}
                className="w-full h-full"
                onLoad={handleIframeLoad}
                sandbox="allow-scripts allow-forms allow-popups allow-downloads"
                title="game-engine-test"
              />
            </div>
          ) : (
            <div className="flex-1 rounded-xl border border-dashed border-border flex items-center justify-center text-muted-foreground text-sm">
              点击"开始游戏"创建会话
            </div>
          )}
        </div>

        {/* Right: test log + result */}
        <div className="flex flex-col gap-3 overflow-hidden">
          <Tabs defaultValue="log" className="flex flex-col flex-1 min-h-0">
            <TabsList className="w-full shrink-0">
              <TabsTrigger value="log" className="flex-1">📋 事件日志</TabsTrigger>
              <TabsTrigger value="result" className="flex-1">🏆 结算结果</TabsTrigger>
            </TabsList>

            <TabsContent value="log" className="flex-1 min-h-0 overflow-y-auto mt-2">
              <div className="space-y-1">
                {log.length === 0 && (
                  <div className="text-muted-foreground text-sm py-4 text-center">等待事件…</div>
                )}
                {log.map((entry, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs font-mono rounded px-2 py-1 bg-card/50 border border-border">
                    {entry.ok
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                      : <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />}
                    <span className="text-muted-foreground shrink-0">{entry.ts}</span>
                    <span className={entry.ok ? "text-foreground" : "text-red-400"}>{entry.msg}</span>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="result" className="flex-1 min-h-0 overflow-y-auto mt-2">
              {!gameResult ? (
                <div className="text-muted-foreground text-sm py-4 text-center">游戏结束后显示</div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
                    <div className="text-4xl font-bold text-primary">{gameResult.totalScore}</div>
                    <div className="text-sm text-muted-foreground mt-1">综合得分</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {[
                      ["转化人数", `${gameResult.convertedCount}/${gameResult.totalPeople}`],
                      ["结局类型", gameResult.endingType],
                      ["最终可信度", gameResult.finalCred],
                      ["最终压力", gameResult.finalPressure],
                      ["回合数", gameResult.totalRounds],
                      ["资源剩余", gameResult.resourcesLeft],
                      ["转化得分", gameResult.conversionScore],
                      ["健康得分", gameResult.healthScore],
                    ].map(([k, v]) => (
                      <div key={String(k)} className="rounded-lg border border-border bg-card/50 p-2">
                        <div className="text-xs text-muted-foreground">{k}</div>
                        <div className="font-medium">{String(v)}</div>
                      </div>
                    ))}
                  </div>
                  <Button
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={handleStartGame}
                  >
                    <RotateCcw className="w-4 h-4 mr-1.5" />
                    再测一局
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
