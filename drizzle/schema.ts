import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
  float,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * One row per completed (or in-progress) game session.
 * Composite score = 50 (base) + resourcesLeft*1.5 + (finalCredibility-finalPressure)*2 + (convertedCount-6)*3
 */
export const gameSessions = mysqlTable("game_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  playerName: varchar("playerName", { length: 128 }),
  status: mysqlEnum("status", ["active", "win", "fail"]).default("active").notNull(),

  // Final state snapshot
  resourcesLeft: int("resourcesLeft").default(0),
  finalCredibility: int("finalCredibility").default(0),
  finalPressure: int("finalPressure").default(0),
  convertedCount: int("convertedCount").default(0),
  totalRounds: int("totalRounds").default(0),

  // Score breakdown
  baseScore: int("baseScore").default(0),
  efficiencyScore: float("efficiencyScore").default(0),
  healthScore: float("healthScore").default(0),
  overAchievementScore: float("overAchievementScore").default(0),
  totalScore: float("totalScore").default(0),

  // Strategy bias tracking
  aggressiveIndex: int("aggressiveIndex").default(0),
  conservativeIndex: int("conservativeIndex").default(0),

  startedAt: timestamp("startedAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt"),
});

export type GameSession = typeof gameSessions.$inferSelect;
export type InsertGameSession = typeof gameSessions.$inferInsert;

/**
 * One row per turn (round) within a session.
 * scoreDeltas: JSON array of { personId, before, after } objects.
 */
export const gameTurns = mysqlTable("game_turns", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  round: int("round").notNull(),
  actionId: varchar("actionId", { length: 64 }),
  actionLabel: varchar("actionLabel", { length: 128 }),
  targets: json("targets").$type<string[]>(),
  prediction: text("prediction"),
  // JSON: { personId: string, nameCn: string, before: number, after: number }[]
  scoreDeltas: json("scoreDeltas").$type<Array<{ personId: string; nameCn: string; before: number; after: number }>>(),
  credibilityAfter: int("credibilityAfter").default(0),
  pressureAfter: int("pressureAfter").default(0),
  resourcesAfter: int("resourcesAfter").default(0),
  outcome: varchar("outcome", { length: 32 }), // 'success' | 'fail' | 'partial'
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GameTurn = typeof gameTurns.$inferSelect;
export type InsertGameTurn = typeof gameTurns.$inferInsert;
