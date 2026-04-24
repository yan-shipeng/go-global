import { eq, desc, asc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, gameSessions, gameTurns, InsertGameSession, InsertGameTurn } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);

  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Game Sessions ────────────────────────────────────────────────────────────

export async function createGameSession(data: InsertGameSession) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(gameSessions).values(data);
  return (result as any).insertId as number;
}

export async function updateGameSession(id: number, data: Partial<InsertGameSession>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(gameSessions).set(data).where(eq(gameSessions.id, id));
}

export async function getGameSession(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(gameSessions).where(eq(gameSessions.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getUserSessions(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(gameSessions)
    .where(and(eq(gameSessions.userId, userId)))
    .orderBy(desc(gameSessions.startedAt));
}

// ─── Game Turns ───────────────────────────────────────────────────────────────

export async function saveTurn(data: InsertGameTurn) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(gameTurns).values({
    ...data,
    targets: data.targets ?? [],
    scoreDeltas: data.scoreDeltas ?? [],
  });
  return (result as any).insertId as number;
}

export async function getSessionTurns(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(gameTurns)
    .where(eq(gameTurns.sessionId, sessionId))
    .orderBy(asc(gameTurns.round));
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export async function getLeaderboard(limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(gameSessions)
    .where(eq(gameSessions.status, "win"))
    .orderBy(desc(gameSessions.totalScore))
    .limit(limit);
}

export async function getLeaderboardStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db.select().from(gameSessions).where(eq(gameSessions.status, "win"));
  if (rows.length === 0) return { avgTotal: 0, avgEfficiency: 0, avgHealth: 0, avgOverAchievement: 0, count: 0 };
  const sum = rows.reduce((acc, r) => ({
    total: acc.total + (r.totalScore ?? 0),
    eff: acc.eff + (r.efficiencyScore ?? 0),
    health: acc.health + (r.healthScore ?? 0),
    over: acc.over + (r.overAchievementScore ?? 0),
  }), { total: 0, eff: 0, health: 0, over: 0 });
  const n = rows.length;
  return {
    avgTotal: sum.total / n,
    avgEfficiency: sum.eff / n,
    avgHealth: sum.health / n,
    avgOverAchievement: sum.over / n,
    count: n,
  };
}
