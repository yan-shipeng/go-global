# China Outbound Online - TODO

## Phase 1: Database Schema
- [x] Add game_sessions table (id, userId, status, score breakdown, resources left, credibility, pressure, converted count, started/ended at)
- [x] Add game_turns table (id, sessionId, round, actionId, targets, prediction, scoreDeltas JSON, credibility/pressure after)
- [x] Generate and apply migration SQL

## Phase 2: Backend API
- [x] game.startSession - create new session, return sessionId
- [x] game.saveTurn - append a turn record
- [x] game.endSession - finalize session, compute composite score, write to leaderboard
- [x] leaderboard.list - paginated leaderboard with rank, player name, score, stats
- [x] compare.sessions - return two sessions' full turn-by-turn data
- [x] history.mine - return current user's sessions with trend data

## Phase 3: Frontend - Core
- [x] Dark theme CSS variables matching game palette (#06111a, #0d8b96)
- [x] App.tsx routes: /, /game, /leaderboard, /compare, /history
- [x] TopNav with user avatar, login/logout, nav links
- [x] Landing page (Home.tsx): hero + login CTA + feature cards
- [x] Game page: embed v25 game engine, auto-inject OAuth username, send turn/end events to API

## Phase 4: Frontend - Social Features
- [x] Leaderboard page: ranked table with score breakdown chips, filter by date
- [x] Game end overlay: score breakdown card + vs. leaderboard average + rank badge
- [x] Decision comparison page: player selector + side-by-side turn table
- [x] Personal history page: session list + recharts line chart for score/resources trend

## Phase 5: Quality & Delivery
- [x] Vitest: game.startSession and saveTurn tests (7/7 passing)
- [x] Vitest: leaderboard.list and stats tests
- [x] Vitest: compare.sessions test
- [x] Save checkpoint

## Phase 6: Remove OAuth Login — Name-Entry Flow
- [x] Convert game.startSession from protectedProcedure to publicProcedure, accept playerName in input
- [x] Convert game.saveTurn from protectedProcedure to publicProcedure, use sessionId ownership via token/name (no userId check)
- [x] Convert game.endSession from protectedProcedure to publicProcedure
- [x] Convert history.mine to use playerName cookie/localStorage instead of userId
- [x] Remove userId FK constraint from game_sessions (or make nullable)
- [x] Replace Home.tsx login CTA with name-entry form (input + start button)
- [x] Replace GamePage login gate with name-entry dialog before iframe loads
- [x] Remove NavBar login/logout/avatar UI; show player name from localStorage only
- [x] Update LeaderboardPage and ComparePage to work without auth context
- [x] Update HistoryPage to filter by playerName stored in localStorage
- [x] Update tests to remove auth context from game procedures (8/8 passing)
- [x] Save checkpoint

## Phase 7: Remove Early-Win / Speed-Win Conditions
- [x] Audit game engine for all endGame/checkEnd triggers
- [x] Remove or disable any win condition that fires before resources reach 0
- [x] Ensure game only ends when resources are exhausted (or fail condition: pressure > pressureCap)
- [x] Updated intro slide, HUD sub-text, and state goal description to reflect new rule
- [x] Re-upload patched game engine and update URL in GamePage.tsx
- [x] Save checkpoint

## Phase 8: Update Scoring Formula (max 100 pts)
- [x] Update game engine postGameEnded: base=30, converted×5, max(0,cred-pressure), min(total,100)
- [x] Remove efficiencyScore/bonusScore from game engine postMessage result
- [x] Update homepage scoring algorithm display section
- [x] Update GamePage end-game overlay score breakdown
- [x] Remove bottom note "仅通关（≥50% 转化）的局次计入排行榜" from homepage
- [x] Re-upload game engine and update URL in GamePage.tsx
- [ ] Save checkpoint
