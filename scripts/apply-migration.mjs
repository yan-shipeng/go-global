import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const statements = [
  // Create game_sessions table
  `CREATE TABLE IF NOT EXISTS \`game_sessions\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`userId\` int NOT NULL,
    \`playerName\` varchar(128),
    \`status\` enum('active','win','fail') NOT NULL DEFAULT 'active',
    \`resourcesLeft\` int DEFAULT 0,
    \`finalCredibility\` int DEFAULT 0,
    \`finalPressure\` int DEFAULT 0,
    \`convertedCount\` int DEFAULT 0,
    \`totalRounds\` int DEFAULT 0,
    \`baseScore\` int DEFAULT 0,
    \`efficiencyScore\` float DEFAULT 0,
    \`healthScore\` float DEFAULT 0,
    \`overAchievementScore\` float DEFAULT 0,
    \`totalScore\` float DEFAULT 0,
    \`startedAt\` timestamp NOT NULL DEFAULT (now()),
    \`endedAt\` timestamp,
    CONSTRAINT \`game_sessions_id\` PRIMARY KEY(\`id\`)
  )`,

  // Create game_turns table (no JSON defaults - TiDB compatibility)
  `CREATE TABLE IF NOT EXISTS \`game_turns\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`sessionId\` int NOT NULL,
    \`round\` int NOT NULL,
    \`actionId\` varchar(64),
    \`actionLabel\` varchar(128),
    \`targets\` json,
    \`prediction\` text,
    \`scoreDeltas\` json,
    \`credibilityAfter\` int DEFAULT 0,
    \`pressureAfter\` int DEFAULT 0,
    \`resourcesAfter\` int DEFAULT 0,
    \`outcome\` varchar(32),
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`game_turns_id\` PRIMARY KEY(\`id\`)
  )`,
];

for (const sql of statements) {
  try {
    await conn.execute(sql);
    const tableName = sql.match(/`(\w+)`/)?.[1] ?? '?';
    console.log('OK: created', tableName);
  } catch (e) {
    console.warn('SKIP:', e.message.slice(0, 100));
  }
}

await conn.end();
console.log('Migration complete');
