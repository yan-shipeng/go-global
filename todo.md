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
- [x] Save checkpoint

## Phase 9: Homepage Redesign & Flash Fix
- [x] Remove any login/auth UI from Home.tsx; show name-entry form for new visitors
- [x] If name already in localStorage, show "你好，{name}" with edit button instead of form
- [x] Add mission briefing interstitial page/modal (uses existing game engine intro iframe) with "跳过，直接开始" option
- [x] GamePage: remove the separate name-entry screen (no longer needed — handled on homepage)
- [x] Fix flash of old game engine name-entry screen: inject SET_PLAYER + SKIP_INTRO immediately on iframe load (0ms delay)
- [x] Verify full flow: land → name → briefing (or skip) → game starts with no flash
- [x] Save checkpoint

## Phase 10: Fix Briefing & Flash Bugs
- [x] Briefing iframe: now uses ?mode=briefing URL param — game engine sets window._briefingMode=true which suppresses SET_PLAYER auto-skip; no name injection needed
- [x] Game iframe flash: now uses ?autoStart=1 URL param — game engine skips intro immediately in bootstrap before any paint
- [x] Game engine patched with URL param support (mode=briefing, autoStart=1) and re-uploaded
- [x] autoStart block reads name from localStorage before skipIntroBtn click (fixes empty-name guard)
- [x] Save checkpoint

## Phase 11: Remove Name Input from Game Engine Intro Screen
- [x] Confirmed: ranking uses playerName from game_sessions.playerName (set via startSession API from localStorage), not from game engine's learnerName
- [x] Game engine bootstrap now always hides introNameBlock div (display:none) in all modes
- [x] Bootstrap reads name from localStorage and pre-fills state.learnerName + learnerNameInput for in-game display
- [x] skipIntroBtn and toIntroBtn handlers updated to use state.learnerName as fallback when input is hidden
- [x] Save checkpoint

## Phase 12: New Scoring Formula (Multiplicative, Max 100)
- [x] Update game engine postGameEnded: score = round((converted/12) × ((max(0,cred-pressure)+10)/20) × 100), min 1, max 100
- [x] Update game engine win condition text in intro slide 2 to reflect new formula
- [x] Update homepage scoring algorithm section (multiplicative formula with × display)
- [x] Update homepage leaderboard feature card description
- [x] Update GamePage end-game overlay to show conversionRatio × healthIndex × 100 breakdown
- [x] Re-upload game engine (game-engine_53f29bc4.html) and update URLs in Home.tsx and GamePage.tsx
- [ ] Save checkpoint
