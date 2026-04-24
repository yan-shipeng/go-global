import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module so tests don't need a real database
vi.mock("./db", () => {
  const mockSession = {
    id: 1,
    userId: null,
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
    createGameSession: vi.fn().mockResolvedValue(42),
    updateGameSession: vi.fn().mockResolvedValue(undefined),
    getGameSession: vi.fn().mockResolvedValue(mockSession),
    getUserSessions: vi.fn().mockResolvedValue([]),
    getSessionsByPlayerName: vi.fn().mockResolvedValue([mockSession]),
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
  };
});

// All procedures are now public — no auth context needed
function makeCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("game.startSession", () => {
  it("creates a session with a player name", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.game.startSession({ playerName: "Alice" });
    expect(result).toMatchObject({ sessionId: 42 });
  });

  it("rejects empty player name", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.game.startSession({ playerName: "" })).rejects.toThrow();
  });
});

describe("game.saveTurn", () => {
  it("saves a turn without authentication", async () => {
    const caller = appRouter.createCaller(makeCtx());
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
  it("returns leaderboard entries sorted by score", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.leaderboard.list({ limit: 10 });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("playerName");
    expect(result[0]).toHaveProperty("totalScore");
    expect(result[0]).toHaveProperty("rank");
    expect(result[0].rank).toBe(1);
  });
});

describe("leaderboard.stats", () => {
  it("returns aggregate stats", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const stats = await caller.leaderboard.stats();
    expect(stats).toHaveProperty("avgTotal");
    expect(stats).toHaveProperty("count");
    expect(typeof stats.avgTotal).toBe("number");
  });
});

describe("history.byPlayerName", () => {
  it("returns sessions for a given player name", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.history.byPlayerName({ playerName: "Alice" });
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty("playerName", "Alice");
  });
});

describe("compare.sessions", () => {
  it("returns two sessions for comparison", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.compare.sessions({ sessionIdA: 1, sessionIdB: 1 });
    expect(result).toHaveProperty("sessionA");
    expect(result).toHaveProperty("sessionB");
    expect(result).toHaveProperty("turnsA");
    expect(result).toHaveProperty("turnsB");
  });
});
