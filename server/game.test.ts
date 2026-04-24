import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module so tests don't need a real database
vi.mock("./db", () => {
  const mockSession = {
    id: 1,
    userId: 1,
    playerName: "Alice",
    status: "win",
    totalScore: 85.5,
    convertedCount: 8,
    resourcesLeft: 12,
    finalCredibility: 70,
    finalPressure: 20,
    totalRounds: 10,
    startedAt: new Date(),
    endedAt: new Date(),
  };

  return {
    // createGameSession returns a plain number (insertId)
    createGameSession: vi.fn().mockResolvedValue(42),
    updateGameSession: vi.fn().mockResolvedValue(undefined),
    getGameSession: vi.fn().mockResolvedValue(mockSession),
    getUserSessions: vi.fn().mockResolvedValue([]),
    // saveTurn returns a plain number (insertId)
    saveTurn: vi.fn().mockResolvedValue(99),
    getSessionTurns: vi.fn().mockResolvedValue([]),
    getLeaderboard: vi.fn().mockResolvedValue([
      {
        id: 1,
        playerName: "Alice",
        totalScore: 85.5,
        convertedCount: 8,
        resourcesLeft: 12,
        finalCredibility: 70,
        finalPressure: 20,
        totalRounds: 10,
        status: "win",
        startedAt: new Date("2026-01-01"),
      },
    ]),
    getLeaderboardStats: vi.fn().mockResolvedValue({
      avgTotal: 75.0,
      avgEfficiency: 18.0,
      avgHealth: 10.0,
      avgOverAchievement: 6.0,
      count: 5,
    }),
    getUserSessionWithTurns: vi.fn().mockResolvedValue(null),
    getSessionWithTurns: vi.fn().mockResolvedValue({
      session: mockSession,
      turns: [],
    }),
  };
});

function makeAuthCtx(userId = 1, name = "Test User"): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `user-${userId}`,
      name,
      email: `user${userId}@test.com`,
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function makeAnonCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("game.startSession", () => {
  it("creates a session for authenticated user", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.game.startSession({});
    expect(result).toMatchObject({ sessionId: 42 });
  });

  it("throws UNAUTHORIZED for unauthenticated user", async () => {
    const caller = appRouter.createCaller(makeAnonCtx());
    await expect(caller.game.startSession({})).rejects.toThrow();
  });
});

describe("game.saveTurn", () => {
  it("saves a turn for authenticated user", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    await expect(
      caller.game.saveTurn({
        sessionId: 1,
        round: 1,
        actionId: "interview",
        actionLabel: "私人访谈",
        targets: ["hr"],
        prediction: "应该能提升信任",
        credibilityAfter: 55,
        pressureAfter: 10,
        resourcesAfter: 46,
        outcome: "success",
      })
    ).resolves.toMatchObject({ turnId: 99 });
  });
});

describe("leaderboard.list", () => {
  it("returns leaderboard entries", async () => {
    const caller = appRouter.createCaller(makeAnonCtx());
    const result = await caller.leaderboard.list({ limit: 10 });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("playerName");
    expect(result[0]).toHaveProperty("totalScore");
  });
});

describe("leaderboard.stats", () => {
  it("returns aggregate stats", async () => {
    const caller = appRouter.createCaller(makeAnonCtx());
    const stats = await caller.leaderboard.stats();
    expect(stats).toHaveProperty("avgTotal");
    expect(stats).toHaveProperty("count");
    expect(typeof stats.avgTotal).toBe("number");
  });
});

describe("compare.sessions", () => {
  it("returns two sessions for comparison", async () => {
    const caller = appRouter.createCaller(makeAnonCtx());
    const result = await caller.compare.sessions({ sessionIdA: 1, sessionIdB: 1 });
    expect(result).toHaveProperty("sessionA");
    expect(result).toHaveProperty("sessionB");
    expect(result).toHaveProperty("turnsA");
    expect(result).toHaveProperty("turnsB");
  });
});
