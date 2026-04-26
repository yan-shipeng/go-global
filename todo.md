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
- [x] Save checkpoint

## Phase 13: Remove Win/Fail Conditions — Score Only
- [x] Game engine intro slide 1: removed ≥50% stat badge; now shows only 48 resources + 12 people
- [x] Game engine intro slide 2: replaced win condition box with scoring algorithm box; eyebrow changed to "得分规则"
- [x] Game engine end screen: both win-pass and fail titles changed to neutral "资源耗尽 · 复盘时刻"
- [x] Game engine HUD: "目标 ≥ 50%" sub-text changed to "转化越多得分越高"
- [x] GamePage end-game overlay: removed CheckCircle2/XCircle won/failed UI; shows neutral Trophy + "游戏结束 · 复盘时刻"
- [x] Re-upload game engine (game-engine_4e9f1f12.html) and update URLs in Home.tsx and GamePage.tsx
- [x] Save checkpoint

## Phase 14: Resistor Discovery Mechanic
- [x] Found confront action at line 1552; resistanceTargets=['union','ops']; revealed state tracks interviews
- [x] Removed explicit resistor identity hints from confront action description
- [x] Added discovery gate: confrontLocked=true unless state.revealed[id] OR any ties/hidden_ties member is revealed
- [x] Locked targets show as '🔒 未知人物' (greyed out, disabled) in target selector
- [x] Re-upload game engine (game-engine_b6fefa57.html) and update URLs in Home.tsx and GamePage.tsx
- [x] Save checkpoint
- [x] Enforce confront discovery gate in runTurn() execution path (not just UI selector) — undiscovered targets are silently blocked even if submitted programmatically
- [x] Re-upload game engine (game-engine_b510c832.html) and update URLs in Home.tsx and GamePage.tsx
- [x] Save checkpoint

## Phase 15: Hide Resistor Identity Until Discovered
- [x] Audit people info panel rendering in game engine — find where person name, role, description, stance are shown
- [x] Identify which data fields reveal resistor identity (role label, description text, resistance stance, etc.)
- [x] Mask resistor-identity fields for union/ops until state.revealed[id] is true (or connected person revealed)
- [x] Show placeholder text ("⬜ 身份待查明" / masked desc) for masked fields; show normal info after discovery
- [x] Re-upload game engine (game-engine_ea4b196e.html) and update URLs in Home.tsx and GamePage.tsx
- [x] Save checkpoint


## Phase 16: Add engineer to secret resistors
- [x] Patch secretResistors / secretR / secretRM / secretSVG arrays to include 'engineer'
- [x] Re-upload game engine (game-engine_4d2274c8.html) and update URLs in Home.tsx and GamePage.tsx
- [x] Save checkpoint

## Phase 17: Discovery event log + briefing hint
- [x] Inject 🔓 discovery log entry in interview action run() when secret resistor first discovered
- [x] Add discovery hint sentence to briefing slide 4 (策略与陷阱)
- [x] Re-upload game engine (game-engine_85aff7d7.html) and update URLs
- [x] Save checkpoint

## Phase 18: Fix briefing iframe name sync bug
- [x] Diagnose: briefing iframe had no onLoad handler — never sent SET_PLAYER postMessage to engine
- [x] Fix: added useRef + onLoad handler to briefing iframe in Home.tsx, sends SET_PLAYER with current playerName
- [x] Save checkpoint

## Phase 19: Fix briefing skip bug
- [x] Diagnose: co-v17-learnerName in localStorage caused skipIntroBtn/startBtn to fire in briefing mode
- [x] Fix: guard skipIntroBtn + startBtn with _briefingMode check; hide skipIntroWrap in briefing mode; post BRIEFING_ENTER_GAME/BRIEFING_SKIP_REQUESTED to parent
- [x] Fix: Home.tsx listens for BRIEFING_ENTER_GAME and BRIEFING_SKIP_REQUESTED to navigate to /game
- [x] Re-upload game engine (game-engine_d26d155a.html) and update URLs
- [x] Save checkpoint

## Phase 20: Native React Briefing Page (replace iframe)
- [x] Build BriefingPage.tsx: 5-slide step-by-step React component (no iframe)
- [x] Slide 1: 任务背景 — 中国制造业集团完成欧洲并购，你是整合负责人
- [x] Slide 2: 游戏规则 — 48资源、12人物、每回合选行动+目标
- [x] Slide 3: 行动类型 — 访谈/说服/约谈/联盟/施压 各类行动说明
- [x] Slide 4: 关键提示 — 阻力者身份需通过访谈发现；得分公式
- [x] Slide 5: 出发 — 显示玩家姓名，"开始模拟"按钮
- [x] Wire into Home.tsx: step="briefing" renders <BriefingPage> instead of iframe
- [x] Remove BRIEFING_URL constant and briefingIframeRef from Home.tsx
- [x] Remove BRIEFING_ENTER_GAME / BRIEFING_SKIP_REQUESTED message listeners
- [x] Run tests (8/8 pass), save checkpoint

## Phase 21: Fix Slide 3 action types
- [x] Replace invented action types with actual 12 actions from game engine (5 groups: 示范/对话沟通/赋能验证/认可压力/对抗纠偏)
- [x] Save checkpoint

## Phase 22: Add conversion stage diagram to Slide 2
- [x] Verified: STATUS_LABELS = [未动, 意识觉醒, 初步理解, 主动参与, 已转化] with glyphs ○◔◑◕●
- [x] Added color-coded stage diagram with arrows to Slide 2 in BriefingPage.tsx
- [x] Save checkpoint

## Phase 23: Reorganize action selector + lower 发布组织邮件 threshold
- [x] Audited: ACTION_GROUPS had 5 groups but wrong mapping; email reqCred was 5, early penalty was round<5
- [x] Reorganized ACTION_GROUPS into 5 groups matching Slide 3: 建立信任/对话沟通/赋能验证/认可压力/对抗纠偏
- [x] Lowered email reqCred: 5→2; relaxed early penalty: round<5→round<2
- [x] Re-uploaded game engine (game-engine_4d91f561.html) and updated GamePage.tsx URL
- [x] Save checkpoint

## Phase 24: Remove flash of old intro screen in game engine
- [x] Located: bootstrap() activated screen-intro before skipBtn.click(), causing 1-frame flash
- [x] Fixed: guarded introEl.classList.add('active') with !autoStart; added belt-and-suspenders hide in autoStart block
- [x] Re-uploaded engine (game-engine_7d8ec575.html), updated GamePage.tsx URL
- [x] 0 TS errors, 8/8 tests pass, save checkpoint

## Phase 25: Eliminate iframe flash on game start
- [x] Add GAME_READY postMessage in game engine (sent after revealSimulationChrome)
- [x] Add opaque overlay in GamePage.tsx that hides iframe until GAME_READY received
- [x] Fade overlay out smoothly on GAME_READY
- [x] Re-upload engine, update URLs, run tests, save checkpoint

## Phase 26: Redesign 发布组织邮件 action (方案B)
- [x] Add affectAllNonConverted() helper: applies diminishing multiplier by status (0→×0.40, 1→×0.70, 2→×0.50, 3→×0.25) to all status<4 people
- [x] Replace affectNonAdopters calls in email action with affectAllNonConverted
- [x] Update email desc to: 广播工具，覆盖所有未转化的人，但说服深度随阶段递减——越是深度观望者，邮件越难打动。第一回合无成果时发送会损失可信度。
- [x] Re-upload engine, update URL, run tests, save checkpoint

## Phase 27: Audit and fix 发布阶段进展 + 讲述成功案例 descriptions
- [x] Audit 发布阶段进展 code mechanics vs description
- [x] Audit 讲述成功案例 code mechanics vs description
- [x] Rewrite both descriptions to match actual code
- [x] Patch engine, re-upload, run tests, save checkpoint

## Phase 29: Three engine UX changes
- [x] Broadcast action detail panel: collapsed by default (remove show class from target-selector)
- [x] Resistor character descriptions: soften/remove explicit 阻力角色 badge and resistor-identity language
- [x] Interview split: 1st visit reveals action prefs only; 2nd visit reveals hidden ties (state.revealed[id] tracks visit count)
- [x] Patch engine, re-upload, run tests, save checkpoint

## Phase 31: New actions + dual network layers
- [x] Add 间接打听 action: 1 resource, targets 1 person, reveals prefs via ties, no hidden info
- [x] Add 休闲聚会 action: 2 resources, targets 2-3 people, social bonding effect, overuse side-effect (credibility penalty)
- [x] Redesign network: add 正式沟通网 / 信任网 toggle buttons
- [x] 正式沟通网 spread: only status 0-1, multiplier ×0.6
- [x] 信任网 spread: only status 2-3, multiplier ×1.2; hidden ties shown only after 2nd interview
- [x] Re-upload engine, update URL, run tests, save checkpoint

## Phase 32: Fix new actions visibility + balance pass
- [x] Audit why 间接打听 and 休闲聚会 are missing from briefing page and action selection
- [x] Fix action registration (check ACTIONS array, briefing render, action list render)
- [x] Balance pass: review all action cost/effect ratios
- [x] Buff 调整激励与奖惩 and pressure-type actions
- [x] Re-upload engine, update URL, run tests, save checkpoint

## Phase 33: Merge new actions into existing groups
- [x] BriefingPage: move 间接打听 into 对话与沟通, 休闲聚会 into 建立信任, remove 关系探索 group
- [x] Engine ACTION_GROUPS: same merge, remove 关系探索 group
- [x] Save checkpoint

## Phase 34: Homepage copy + 间接打听 one-time restriction
- [x] Home.tsx: update "12 种行动" → "14 种行动"
- [x] Engine: add indirectInquiryUsed set to state, gate 间接打听 on !used, show grayed-out in target list if already used on that person
- [x] Re-upload engine, update URL, run tests, save checkpoint

## Phase 35: Four engine/UI fixes
- [x] Replace all 周 with 资源 in engine UI (action cards, briefing, tooltips, etc.) and BriefingPage.tsx
- [x] Add neutral character bios for union, ops, engineer (立场复杂 characters)
- [x] Rename 紧密关系 → 正式沟通关系 in key-info panel; remove 隐藏目标 from key-info panel
- [x] 休闲聚会: change need to max 4, cost = targets selected (1 person=2, 2=3, 3=4, 4=5 resources), dynamic cost display
- [x] Re-upload engine, update URL, run tests, save checkpoint

## Phase 36: Fix broadcast actions + redesign 休闲聚会
- [x] Fix broadcast action (need:0) ready condition: selectedTargets.length>=1 blocks execution; fix to allow need:0 actions with 0 targets selected
- [x] Fix resources check in problems array: uses a.weeks instead of dynCost (affects social-gathering display)
- [x] 休闲聚会 redesign: need:1, max 6 targets, cost = targets+2 (3 for 1 person, up to 8 for 6 people), overuse threshold raised to 5th use
- [x] Re-upload engine, update URL, run tests, save checkpoint

## Phase 38: Balance optimization (9 changes)
- [x] exemplify: phase-sensitive effect (early<3: +12 broad; mid 3-7: +6 broad; late>7: +3 broad + cred+1)
- [x] email: add fatigue mechanism (3rd+ use: halved multipliers); remove round-1 zero-conversion penalty
- [x] success-story: add use-count decay (1-2: +10; 3-4: +5; 5+: +3)
- [x] incentive: 3-tier effect (status=0: broad+10; status=1-2: broad+18; status>=3: direct+18); reqCred 8->9
- [x] social-gathering: raise base effects (s0:+3, s1:+6, s2:+8, s3+:+5); softenNeighbors when converted present
- [x] remove team-building (非正式交流) from ACTIONS array
- [x] confront: success path forces status to 2; chilling effect on neighbors (-3); untracked penalty next decay
- [x] indirect-inquiry: cost 2 resources, allow 2 targets (need:2, maxNeed:2)
- [x] interview: cost 2 resources, only 1 target (need:1, maxNeed:1)
- [x] training: status>=2 gives +15, status<2 gives +10
- [x] update all affected desc strings

## Phase 41: Comprehensive Mobile UX Overhaul
- [x] NavBar.tsx: mobile pill indicator, larger touch targets, active state
- [x] LeaderboardPage.tsx: mobile card layout (hidden sm:grid desktop table, sm:hidden mobile card)
- [x] HistoryPage.tsx: 2-col mobile grids, mobile sub-stats inline, trend chart responsive
- [x] ComparePage.tsx: mobile stacked turn layout (per-round A/B side-by-side), 2-col mini stats
- [x] Home.tsx: hero title text-3xl sm:text-4xl, score formula vertical stack on mobile, feature cards 2-col on mobile
- [x] BriefingPage.tsx: confirmed Babel parse error resolved (curly quotes removed in previous checkpoint)
- [x] 8/8 tests passing
- [x] Save checkpoint

## Phase 42: PM Exclusion + CEO-PM Trust Mechanic + Trust Network Rebuild
- [x] Exclude PM from all action target lists (every action's need/max selector should not show pm)
- [x] CEO always trusts PM by default (ceo→pm trust link active from game start)
- [x] CEO trust toward PM can be broken by: (a) major crisis event (pressure spike ≥ threshold), or (b) CFO influence (cfo status≥3 and ceo-cfo tie exists)
- [x] If CEO trust in PM is broken, add a "修复信任" path (e.g., via 1-on-1 persuade or coalition action targeting ceo)
- [x] Rebuild trust network (hiddenTies): every person has at least 1 trust link; network is sparse (≤2 links per person avg); no isolated nodes
- [x] Re-upload patched engine, update URL in GamePage.tsx
- [x] Run tests (8/8), save checkpoint

## Phase 43: PM hidden_ties / Interview simplification / Social-gathering rebalance
- [x] Remove PM from all hidden_ties (pm should have no hidden trust links with anyone)
- [x] Interview: single visit unlocks all info (prefs + hidden ties); increase cooldown to 3; remove 2nd-visit logic
- [x] Social-gathering: audit cost/effect vs other actions, rebalance if needed
- [x] Upload engine, update URL, run tests, save checkpoint

## Phase 44: Interview warning badge / Indirect-inquiry ties unlock / CEO-PM broken link visual
- [x] Interview: show ⚠️ warning badge on target node when interviewCount >= 2 (2nd visit done, 3rd will trigger penalty)
- [x] Indirect-inquiry: unlock partial formal ties (ties array) on target; interview unlocks hidden_ties; clear info hierarchy
- [x] CEO-PM trust broken: render CEO→PM edge as dashed red line when ceoPmTrustBroken=true in trust network graph
- [x] Upload engine, update URL, run tests, save checkpoint

## Phase 45: Network view fix / Difficulty rebalance / Interview cooldown
- [x] Network view in decision panel: allow switching between all layers (social/trust/both), not just trust
- [x] Difficulty rebalance: identify bottlenecks causing <50% conversion rate, propose and apply targeted fixes
- [x] Interview cooldown: reduce from 3 to 2 rounds
- [x] Upload engine, update URL, run tests, save checkpoint

## Phase 46: Social-gathering rebalance / Remove confront
- [x] Social-gathering: maxNeed 6→4, weeks 1→2 (cost 2 resources), cooldown stays 3, converted-attendee bonus stronger
- [x] Remove confront (对抗纠偏) action from ACTIONS array
- [x] Upload engine, update URL, run tests, save checkpoint

## Phase 47: Remove numbers from all action descriptions
- [x] Rewrite all action desc fields in game engine (no specific numbers, qualitative only)
- [x] Rewrite all action descs in BriefingPage.tsx to match
- [x] Upload engine, update URL, run tests, save checkpoint

## Phase 48: BriefingPage cleanup + cooldown countdown + info-tier note
- [x] Remove "对抗纠偏" group from BriefingPage Slide3 action groups
- [x] Update action count in Slide3 title from "14 种行动" to "13 种行动"
- [x] Add info-tier comparison note below "对话与沟通" group in Slide3
- [x] Engine: add cooldown countdown ("还需 N 轮") in action selection panel for cooled-down actions
- [x] Upload engine, update URL, run tests, save checkpoint
