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

## Phase 49: Fix interview single-visit bug
- [x] Change all interviewCount >= 2 checks to >= 1 (hiddenTiesSection, showHiddenGoal, rDiscovered, rDiscoveredM, trust network diffusion, network edge rendering)
- [x] Remove "再次访谈后可解锁" hint text
- [x] Update locked hint text to say single visit unlocks all
- [x] Keep warning badge (>= 2) intentionally for repeat-visit warning
- [x] Upload engine, update URL, run tests, save checkpoint

## Phase 50: Indirect-inquiry used styling + ties differentiation in node detail
- [x] Indirect-inquiry: stronger "already used" visual (deeper grayscale + strikethrough on name)
- [x] Node detail panel: differentiate formal ties (🏢 cyan) vs hidden ties (🔗 amber)
- [x] Upload engine, update URL, run tests, save checkpoint

## Phase 51: Remove indirect-inquiry action completely
- [x] Engine: remove action definition (id:'indirect-inquiry' block)
- [x] Engine: remove indirectInquiryUsed state init and all references
- [x] Engine: remove indirectTiesRevealed state init and all references
- [x] Engine: remove indirectUsed / indirectMark / nameStyle rendering code in target selector
- [x] Engine: remove ties-reveal logic in run() (the tiesMsg / indirectTiesRevealed code)
- [x] BriefingPage: remove 间接打听 from action groups slide
- [x] BriefingPage: update action count (13→12)
- [x] BriefingPage: remove info-tier comparison note (references indirect-inquiry)
- [x] Upload engine, update URL, run tests, save checkpoint

## Phase 52: Social-gathering rebalance (cost/effect ratio too low)
- [x] Audit current social-gathering run() effects vs cost (2 resources, cooldown 3)
- [x] Compare with other 2-resource actions (exemplify, endorse, pilot, etc.)
- [x] Increase base effects and/or converted-attendee bonus to make it worthwhile
- [x] Upload engine, update URL, run tests, save checkpoint

## Phase 53: Social-gathering cost/desc fix
- [x] Confirm maxNeed=4, set resource cost to appropriate value (weeks param)
- [x] Update engine desc to reflect new params and effects
- [x] Update BriefingPage social-gathering description
- [x] Upload engine, update URL, run tests, save checkpoint

## Phase 54: Resistance adjustment
- [x] sales (销售主管): change from normal to stubborn/resistant (stubborn:true, score lowered to ~8-12, convertThreshold raised)
- [x] ops (运营主管): change from stubborn to normal (stubborn:false, score raised to ~20-25, convertThreshold normal)
- [x] Upload engine, update URL, run tests, save checkpoint

## Phase 55: Sales/ops desc update + sales prefs rebalance + customer-pressure event
- [x] BriefingPage: sales desc add resistance hint; ops desc remove stability/resistance language
- [x] Engine: rebalance sales prefs (lower narrative bonus, higher institution penalty)
- [x] Engine: add customer-pressure event (sales status<=1 triggers 大客户投诉, +pressure)
- [x] Upload engine, update URL, run tests, save checkpoint

## Phase 56: Log warning style + sales hidden_goal + ops positive event
- [x] Engine: log entry for 大客户投诉 rendered as red warning card (distinct from normal log)
- [x] Engine: sales hidden_goal updated to specific narrative text about commission system threat
- [x] Engine: ops positive event (status>=3 triggers 跨部门协调, pressure -1, one-time)
- [x] Upload engine, update URL, run tests, save checkpoint

## Phase 57: Hidden ties mechanics — Proposal A + B1
- [x] Engine (Proposal A): social-gathering checks hidden_ties in addition to formal ties; discovered hidden_ties give base+8 bonus; undiscovered hidden_ties auto-reveal at end of turn with log note
- [x] Engine (Proposal B1): softenNeighbors log output explicitly names the hidden-tie path when diffusion travels via hidden_ties
- [x] Update social-gathering desc to reflect new hidden_ties mechanic
- [x] Upload engine, update URL, run tests, save checkpoint

## Phase 58: B3 negative events + region hidden_ties redesign
- [x] Engine: ops→cfo negative event — if ops status<=1 at round>=5 AND cfo status>=3, trigger one-time budget-freeze warning (+1 pressure, cred-1, log note)
- [x] Engine: finance→cfo negative event — if finance status<=1 at round>=4 AND cfo status>=2, trigger one-time adverse-report warning (cred-1, log note)
- [x] Engine: region hidden_ties redesign — change region.hidden_ties from ['plant'] to ['ceo']
- [x] Engine: update region desc to hint at the CEO back-channel
- [x] Engine: add state flags _opsCfoNegTriggered and _financeCfoNegTriggered to state init
- [x] Upload engine, update URL, run tests, save checkpoint

## Phase 60+61: region→ceo positive event + end-screen hidden-ties stats
- [x] Engine (P60): region→ceo positive event — when region status becomes >=4 AND region→ceo hidden tie is unlocked, apply one-time 1.3x softening multiplier to ceo and log note
- [x] Engine (P60): add state flag _regionCeoBoostTriggered to state init
- [x] Engine (P61): compute hidden-ties utilization stats at game end (total pairs, discovered, activated, missed key paths)
- [x] Engine (P61): include hiddenTiesStats in GAME_ENDED postMessage payload
- [x] Frontend (P61): display hidden-ties utilization panel in game result overlay
- [x] Upload engine, update URL, run tests, save checkpoint

## Phase 62: Remove numeric values from all action descriptions
- [x] Rewrite social-gathering desc: accurate, qualitative, no numbers
- [x] Audit and rewrite all other action desc fields that contain specific numeric values
- [x] Upload engine, update URL, run tests, save checkpoint

## Phase 63: Action result panel cleanup + social-gathering cost fix + trust network arrows
- [x] Engine: rewrite email action interpretation text (动作解读) — remove "40%" and other specific numeric values, keep qualitative language
- [x] Engine: fix social-gathering cost to fixed 3 resources (remove dynamic cost logic); update all cost displays from "3-8 资源（动态）" to "3 资源"
- [x] Engine: trust network graph — draw directional arrows for one-way hidden_ties (A→B but not B→A)
- [x] Upload engine, update URL, run tests, save checkpoint

## Phase 64: Trust network bidirectional arrows + legend
- [x] Engine: mutual hidden ties draw two separate directed lines (A→B and B→A) instead of one undirected line, so both ends show arrowheads
- [x] Engine: add legend row below trust network SVG — 实线=正式关系、虚线=隐藏关系、箭头=单向影响
- [x] Upload engine, update URL, run tests, save checkpoint

## Phase 64: Trust network arrows/legend + node detail hidden-tie card
- [x] Engine: mutual hidden ties draw two separate directed lines (A→B and B→A) with arrowheads on both ends
- [x] Engine: add legend row below trust network SVG — 实线=正式关系、虚线=隐藏关系、箭头=单向影响
- [x] Engine: node detail panel — show discovered hidden ties as amber card (relation target name + relation nature), separate from formal ties
- [x] Upload engine, update URL, run tests, save checkpoint

## Phase 65: Resistor badge + event text fixes
- [x] Engine: hide "立场复杂" resistor badge until character is interviewed (same gate as hidden_goal reveal)
- [x] Engine: remove "立场复杂" resistor badge after character is converted (status >= 4)
- [x] Engine: strip advice sentence from customer-complaint event log text ("建议尽快争取销售主管的支持")
- [x] Engine: clear pm.hidden_ties (pm should have no hidden ties)
- [x] Upload engine, update URL, run tests, save checkpoint

## Phase 66: Fix text implying only interviews unlock hidden ties
- [x] Engine: update social-gathering desc to explicitly mention hidden-ties reveal
- [x] Engine: update private-interview desc to clarify it is ONE of two ways to reveal hidden ties
- [x] Frontend BriefingPage: fix the note "私人访谈一次即可解锁：动作偏好 + 隐藏关系网络" to include social-gathering
- [x] Upload engine, update URL, run tests, save checkpoint

## Phase 67: Resources 48→50 + Random Events System
- [x] Engine: change TOTAL_RESOURCES from 48 to 50; update role briefing/goal text
- [x] Engine: implement 6-event random event system with ~30% per-turn trigger chance
  - [x] Positive: 行业媒体报道 (cred+1, soften all), 自发口碑扩散 (converted neighbor +8), 季度数据利好 (pressure-1)
  - [x] Negative: 内部传言扩散 (random non-converted -8, pressure+1), 生产线突发故障 (plant -10, pressure+2), 总部战略调整信号 (cred-1, untouched +5 decay)
- [x] Engine: add state flags for random events (prevent repeat triggers per game)
- [x] Frontend BriefingPage: update "48 个资源" to "50 个资源" in all text
- [x] Upload engine, update URL, run tests, save checkpoint

## Phase 68: Converted resistor no negative leverage + private-meeting 2 targets
- [x] Engine: converted resistors (status>=4) skip negative leverage effect on neighbors
- [x] Engine: private-meeting allows selecting up to 2 targets; per-person score gain reduced (split effect)
- [x] Engine: update private-meeting desc and cost chip to reflect 2-target option
- [x] Upload engine, update URL, run tests, save checkpoint

## Phase 69: Site-wide interview text update (2-target)
- [x] Frontend BriefingPage: update interview desc from "每次只能访谈一人" to reflect 1-2 targets
- [x] Frontend BriefingPage: update interview note/tip text if it mentions single-target only
- [x] Engine: verify engine desc already updated (Phase 68)
- [x] Save checkpoint

## Phase 70: Bar-color legend + end-game timing fix
- [x] Engine: add progress-bar color legend below target selector header (青=推进中, 橙=接近升阶, 绳=已转化)
- [x] Engine: audit end-game timing — ensure last action effects fully resolve before postGameEnded/scoring
- [x] Upload engine, update URL, run tests, save checkpoint

## Phase 71: Resources 60 + incentive rebalance + 4-category action types + prefs rewrite
- [x] TOTAL_RESOURCES 50 → 60
- [x] incentive: weeks 3→5, disrupt +2→3, effect 18→22
- [x] Collapse action types to 4: 沟通/示范/赋能/制度 (政治+压力 → 制度)
- [x] Rewrite all 12 character prefs with 4-category system
- [x] Update ACTION_TYPE_ALIASES (remove 沟通/对话 alias)
- [x] Update ACTION_GROUPS UI labels
- [x] Upload engine, update URL, run tests, save checkpoint

## Phase 72: Hero text fix + leaderboard strategy-bias column
- [x] Home.tsx hero: fix "50 个资源" → "60 个资源"
- [x] LeaderboardPage: add 策略偏向 column (制度主导 / 沟通主导 / 均衡型)
- [x] Backend: expose aggressiveIndex + conservativeIndex in leaderboard.list result
- [x] Run tests, save checkpoint

## Phase 73: Strategy-bias in HistoryPage + BriefingPage slide 4 tip
- [x] HistoryPage: add strategyBias label to each session card (reuse same logic as LeaderboardPage)
- [x] BriefingPage slide 4: add strategy tip paragraph about 制度 vs 沟通 tradeoff + visibility
- [x] Run tests, save checkpoint

## Bug Fix: Session not saved after game ends
- [x] Check network logs for endSession API call failure
- [x] Check if GAME_ENDED message is received by GamePage
- [x] Root cause: stale closure in useEffect — sessionId and mutateAsync refs were stale when GAME_ENDED fired
- [x] Fix: use useRef for sessionId + mutateAsync, register handler once with useCallback
- [x] Verified deployed API works correctly (startSession + endSession + leaderboard all OK)
- [x] 8/8 tests pass

## Phase 74: Game-end UX + Leaderboard highlights
- [x] GamePage end panel: "查看排名" button already existed; strategy bias tag added to score card
- [x] LeaderboardPage: my row now highlighted with yellow-400/10 bg + left border-l-4
- [x] 8/8 tests pass

## CRITICAL BUG: Session/turns not saved when resources run out
- [x] Engine GAME_ENDED fires correctly via _pendingEnd flow
- [x] GamePage handler uses refs correctly (no stale closure)
- [x] ROOT CAUSE: server computeScore formula differs from engine formula — leaderboard showed wrong scores
- [x] FIX: endSession now accepts totalScore/baseScore/healthScore from engine; server uses them directly
- [x] FIX: GamePage passes result.totalScore/baseScore/healthScore to endSession
- [x] TSC OK, 8/8 tests pass

## Bug Fix Phase 75
- [x] Engine: fix sales missing from secretR/secretRM arrays — "立场复杂" badge now hidden until discovered
- [x] Critical: root cause found — engine URL was never updated after Phase 70-72 patches; production used old engine without aggressiveIndex/GAME_ENDED fixes
- [x] Fix: upload new engine, update GAME_ENGINE_URL to game-engine_1e4ccc5d.html
- [x] 8/8 tests pass

## CRITICAL Phase 76: Deep audit + self-test of session save pipeline
- [x] Audit: API chain works perfectly (startSession → saveTurn x3 → endSession → leaderboard all OK)
- [x] ROOT CAUSE: engine served from CloudFront CDN (cross-origin iframe) — window.parent===window check threw SecurityError, caught silently, postMessage NEVER fired
- [x] FIX: removed window.parent===window guards from postTurnData and postGameEnded (Phase 76 patch)
- [x] Engine uploaded as game-engine_fca4b127.html, GAME_ENGINE_URL updated in GamePage.tsx
- [x] Self-test SELFTEST_PHASE76 confirmed in leaderboard (id=960005, totalScore=68, aggressiveIndex=2)
- [x] 8/8 tests pass

## CRITICAL Phase 77: Fix GAME_ENDED never firing for real users
- [x] ROOT CAUSE: postGameEnded() was ONLY called when user clicked "📊 查看最终结算" button (goNextRound flow). If user didn't click the button (e.g., navigated away, or flow was different), GAME_ENDED was never sent.
- [x] FIX: Added postGameEnded() call inside renderEndingScreen() — fires as soon as ending screen renders, regardless of button clicks
- [x] FIX: Added _gameEndedPosted flag to state to prevent duplicate GAME_ENDED messages (goNextRound also calls postGameEnded)
- [x] FIX: Removed allow-same-origin from iframe sandbox attribute (was unnecessary and potentially harmful for cross-origin CDN iframe)
- [x] Engine uploaded as game-engine_51b31f2a.html, GAME_ENGINE_URL updated in GamePage.tsx
- [x] Self-test SELFTEST_P77B confirmed in DB (id=990003, totalScore=81, aggressiveIndex=4)
- [x] 8/8 tests pass

## Phase 83: Add SET_RESOURCES test button handler to engine
- [x] Insert SET_RESOURCES postMessage handler into game-engine.html (before SKIP_INTRO listener)
- [x] Handler sets state.resources to e.data.value and calls render()
- [x] Upload updated engine as game-engine_6c9b6e49.html
- [x] Update GAME_ENGINE_URL in GameTestPage.tsx and GamePage.tsx to game-engine_6c9b6e49.html
- [x] TSC 0 errors, 8/8 tests pass

## Phase 84: Add PostGameSummary to /game-test

- [x] Add full PostGameSummary overlay (本局总览 / 排行榜 / 回合日志) to GameTestPage.tsx

## Phase 85: Fix /game-test PostGameSummary empty (sessionId race condition)

- [x] Fix: sessionId is null when PostGameSummary mounts → TurnLog and Leaderboard show empty
- [x] Fix: onRestart calls handleStartGame which resets sessionId before PostGameSummary unmounts

## Phase 86: Add close button to /game-test PostGameSummary

- [x] Add "关闭结算" (X) button to PostGameSummary overlay so user can dismiss it and return to the engine's ending screen

## Phase 87: Integrate PostGameSummary into game engine ending screen

- [x] Inspect engine ending screen HTML structure (tabs, layout)
- [x] Modify game engine: add React summary panel slot inside ending screen
- [x] Update GameTestPage.tsx: inject summary HTML into engine via postMessage instead of overlay

## Phase 88: Fix ending screen not showing after resource exhaustion

- [x] Trace resource-exhaustion path in game engine (checkEnding → _pendingEnd → modal → goNextRound)
- [x] Fix the ending trigger so ending screen reliably shows when resources = 0

## Phase 89: Fix blank leaderboard in ending screen summary panel

- [x] Diagnose why injected summary iframe shows blank leaderboard
- [x] Fix iframe height and leaderboard data loading/display

## Phase 90: Plan A — unified full-screen result page
- [x] Extend GAME_ENDED payload with ending narrative (title, story, teachPoints, realWorld, endingType)
- [x] Build GameResultPage component: full-screen, replaces iframe, shows narrative + 本局总览 + 排行榜 + 回合日志
- [x] Apply to both GameTestPage.tsx and GamePage.tsxx

## Phase 90: Plan A — unified full-screen result page

- [x] Extend GAME_ENDED payload with narrative (title, story, teach, realWorld, cls)
- [x] Build FullResultPage component (replaces iframe after game ends)
- [x] Upload new engine game-engine_ca0c5ad1.html with narrative support
- [x] Update GameTestPage.tsx to use new engine and FullResultPage

## Phase 91: Enrich result page + PDF export

- [x] Audit all valuable data in GAME_TURN and GAME_ENDED payloads
- [x] Add missing fields to DB schema (actionType, story, deltaConverted, weeksUsed, turnScore, milestones, movers) and saveTurn procedure
- [x] Enrich TurnLog component with all new fields
- [x] Add one-click PDF export button using browser print API with print-optimized CSS

## Phase 92: Apply FullResultPage to /game, clean up, CSV export

- [x] Rewrite GamePage.tsx to use FullResultPage (Plan A) — same as /game-test, with narrative + 本局总览 + 排行榜 + 回合日志
- [x] Update GamePage.tsx GAME_TURN handler to save all enriched fields (actionType, story, deltaConverted, weeksUsed, turnScore, milestones, movers)
- [x] Add frozenSessionId pattern to GamePage.tsx (captures sessionId at GAME_ENDED moment)
- [x] Remove GameSummaryPage import and /game-summary route from App.tsx (cleanup)
- [x] Add CSV export helper (escapeCsv, downloadCsv) to both GamePage.tsx and GameTestPage.tsx
- [x] Add "下载 CSV" button to 回合日志 tab in both pages (exports all enriched fields)
- [x] Pass playerName to TurnLog for CSV filename in both pages
- [x] TSC 0 errors, 8/8 tests pass

## Phase 93: Fix PM inclusion bugs + sync /game-test result page

- [x] Fix game engine: postGameEnded convertedCount now excludes PM (Object.entries + id!=='pm')
- [x] Fix game engine: detectMilestones beforeConv/afterConv now exclude PM
- [x] Fix game engine: scoreThisRound deltaConverted now excludes PM
- [x] Fix game engine: newlyConverted in scoreThisRound and keyNode bonus now exclude PM
- [x] Fix game engine: GAME_TURN convertedAfter now excludes PM
- [x] Fix game engine: checkRandomEvents convertedIds now excludes PM
- [x] Re-upload patched engine as game-engine_89a91c69.html
- [x] Update GAME_ENGINE_URL in GamePage.tsx to game-engine_89a91c69.html
- [x] Update GAME_ENGINE_URL in GameTestPage.tsx to game-engine_89a91c69.html
- [x] Sync GameTestPage.tsx LeaderboardPanel to match GamePage.tsx (global stats + compare feature + strategy bias)
- [x] TSC 0 errors, 8/8 tests pass
## Phase 104: Rewrite TurnLog to replicate in-game turn log
- [x] Add recharts import to GamePage.tsx
- [x] Add STATUS_LABELS constant and parseMoverString() function to GamePage.tsx
- [x] Fix TurnData.movers type to accept string[] (actual engine format)
- [x] Fix normaliseTurn() to parse string movers into {name, beforeLabel, afterLabel, isUpgrade} objects
- [x] Fix movers rendering in TurnLog: show "人名：旧状态 → 新状态" with colored badges
- [x] Add 3 recharts LineCharts at top of TurnLog: 已转化人数 (green), 可信度 (teal), 激进压力 (red)
- [x] Build trendData from turns array (credibilityAfter, pressureAfter, deltaConverted cumulative)
- [x] Add milestone vertical reference lines on charts (yellow dashed)
- [x] Fix CSV export movers column to handle string format
- [x] Sync all TurnLog changes to GameTestPage.tsx
- [x] TypeScript 0 errors, 8/8 tests pass

## Phase 106: Fix result page navigation
- [x] Persist gameResult + frozenSessionId to localStorage so result page survives navigation to /history
- [x] Add "← 返回结算页" button in HistoryPage when a recent result exists in localStorage

## Phase 105: Turn Transition Animation Overlay
- [x] Add TurnOverlay component — cool slide-in card after each GAME_TURN, skippable by any key/click
- [x] Wire GAME_TURN message handler to show overlay with turn summary data
- [x] Auto-dismiss after 2.5s; dismiss on any keypress or click
- [x] Apply same to GameTestPage.tsx

## Phase 106: Turn Overlay Redesign + Ordering Fix
- [x] Patch game engine: delay showModal until React overlay is dismissed (OVERLAY_DISMISSED postMessage)
- [x] Redesign TurnOverlay to emphasize action execution (action name, type, targets) — not results
- [x] Fix ordering: React overlay first, then engine result modal

## Phase 107: Cinematic TurnOverlay
- [x] Faster entrance (< 200ms), full-screen flash + scan-line effect, staggered content reveal
- [x] Apply same to GameTestPage.tsx
