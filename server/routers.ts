import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  createGameSession,
  updateGameSession,
  getGameSession,
  getSessionsByPlayerName,
  saveTurn,
  getSessionTurns,
  getLeaderboard,
  getLeaderboardStats,
} from "./db";

// ─── Score calculation helper ─────────────────────────────────────────────────
function computeScore(params: {
  status: "win" | "fail" | "active";
  resourcesLeft: number;
  finalCredibility: number;
  finalPressure: number;
  convertedCount: number;
}) {
  const { status, resourcesLeft, finalCredibility, finalPressure, convertedCount } = params;
  // All completed games scored uniformly regardless of win/fail
  if (status === "active") return { baseScore: 0, efficiencyScore: 0, healthScore: 0, overAchievementScore: 0, totalScore: 0 };
  const baseScore = 40;
  const efficiencyScore = Math.round(resourcesLeft * 1.5 * 10) / 10;
  const healthScore = Math.round((finalCredibility - finalPressure) * 2 * 10) / 10;
  const overAchievementScore = Math.max(0, Math.round((convertedCount - 6) * 3 * 10) / 10);
  const totalScore = Math.round((baseScore + efficiencyScore + healthScore + overAchievementScore) * 10) / 10;
  return { baseScore, efficiencyScore, healthScore, overAchievementScore, totalScore };
}

// ─── Routers ──────────────────────────────────────────────────────────────────

const gameRouter = router({
  /** Create a new game session and return its ID */
  startSession: publicProcedure
    .input(z.object({ playerName: z.string().min(1).max(64) }))
    .mutation(async ({ input }) => {
      const sessionId = await createGameSession({
        playerName: input.playerName,
        status: "active",
        startedAt: new Date(),
      });
      return { sessionId };
    }),

  /** Append one turn record to an existing session */
  saveTurn: publicProcedure
    .input(z.object({
      sessionId: z.number(),
      round: z.number(),
      actionId: z.string().optional(),
      actionLabel: z.string().optional(),
      targets: z.array(z.string()).optional(),
      prediction: z.string().optional(),
      scoreDeltas: z.array(z.object({
        personId: z.string(),
        nameCn: z.string(),
        before: z.number(),
        after: z.number(),
      })).optional(),
      credibilityAfter: z.number(),
      pressureAfter: z.number(),
      resourcesAfter: z.number(),
      outcome: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const session = await getGameSession(input.sessionId);
      if (!session) throw new Error("Session not found");
      const turnId = await saveTurn({
        sessionId: input.sessionId,
        round: input.round,
        actionId: input.actionId,
        actionLabel: input.actionLabel,
        targets: input.targets ?? [],
        prediction: input.prediction,
        scoreDeltas: input.scoreDeltas ?? [],
        credibilityAfter: input.credibilityAfter,
        pressureAfter: input.pressureAfter,
        resourcesAfter: input.resourcesAfter,
        outcome: input.outcome,
      });
      return { turnId };
    }),

  /** Finalize a session, compute score, write to leaderboard */
  endSession: publicProcedure
    .input(z.object({
      sessionId: z.number(),
      status: z.enum(["win", "fail"]),
      resourcesLeft: z.number(),
      finalCredibility: z.number(),
      finalPressure: z.number(),
      convertedCount: z.number(),
      totalRounds: z.number(),
      // Engine-computed scores (authoritative — use these directly)
      totalScore: z.number().optional(),
      baseScore: z.number().optional(),
      conversionScore: z.number().optional(),
      healthScore: z.number().optional(),
      aggressiveIndex: z.number().optional().default(0),
      conservativeIndex: z.number().optional().default(0),
    }))
    .mutation(async ({ input }) => {
      const session = await getGameSession(input.sessionId);
      if (!session) throw new Error("Session not found");
      // Use engine-provided scores if available; fall back to server computation
      const scores = (input.totalScore != null)
        ? {
            totalScore: input.totalScore,
            baseScore: input.baseScore ?? 0,
            efficiencyScore: 0,
            healthScore: input.healthScore ?? 0,
            overAchievementScore: 0,
          }
        : computeScore({
            status: input.status,
            resourcesLeft: input.resourcesLeft,
            finalCredibility: input.finalCredibility,
            finalPressure: input.finalPressure,
            convertedCount: input.convertedCount,
          });
      await updateGameSession(input.sessionId, {
        status: input.status,
        resourcesLeft: input.resourcesLeft,
        finalCredibility: input.finalCredibility,
        finalPressure: input.finalPressure,
        convertedCount: input.convertedCount,
        totalRounds: input.totalRounds,
        aggressiveIndex: input.aggressiveIndex,
        conservativeIndex: input.conservativeIndex,
        ...scores,
        endedAt: new Date(),
      });
      return { scores };
    }),

  /** Get a single session with all turns */
  getSession: publicProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      const session = await getGameSession(input.sessionId);
      if (!session) throw new Error("Session not found");
      const turns = await getSessionTurns(input.sessionId);
      return { session, turns };
    }),
});

const leaderboardRouter = router({
  list: publicProcedure
    .input(z.object({ limit: z.number().optional().default(50) }))
    .query(async ({ input }) => {
      const rows = await getLeaderboard(input.limit);
      return rows.map((r, i) => ({ ...r, rank: i + 1 }));
    }),

  stats: publicProcedure.query(async () => {
    return getLeaderboardStats();
  }),
});

const historyRouter = router({
  /** Return all sessions for a given player name (stored in localStorage on client) */
  byPlayerName: publicProcedure
    .input(z.object({ playerName: z.string().min(1) }))
    .query(async ({ input }) => {
      return getSessionsByPlayerName(input.playerName);
    }),

  sessionDetail: publicProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      const session = await getGameSession(input.sessionId);
      if (!session) throw new Error("Not found");
      const turns = await getSessionTurns(input.sessionId);
      return { session, turns };
    }),
});

const compareRouter = router({
  /** Return full turn data for two sessions side by side */
  sessions: publicProcedure
    .input(z.object({ sessionIdA: z.number(), sessionIdB: z.number() }))
    .query(async ({ input }) => {
      const [sessionA, turnsA, sessionB, turnsB] = await Promise.all([
        getGameSession(input.sessionIdA),
        getSessionTurns(input.sessionIdA),
        getGameSession(input.sessionIdB),
        getSessionTurns(input.sessionIdB),
      ]);
      if (!sessionA || !sessionB) throw new Error("Session not found");
      return { sessionA, turnsA, sessionB, turnsB };
    }),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  game: gameRouter,
  leaderboard: leaderboardRouter,
  history: historyRouter,
  compare: compareRouter,
});

export type AppRouter = typeof appRouter;
