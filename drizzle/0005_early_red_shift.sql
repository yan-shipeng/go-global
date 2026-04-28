ALTER TABLE `game_turns` ADD `actionType` varchar(64);--> statement-breakpoint
ALTER TABLE `game_turns` ADD `story` text;--> statement-breakpoint
ALTER TABLE `game_turns` ADD `deltaConverted` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `game_turns` ADD `weeksUsed` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `game_turns` ADD `turnScore` float DEFAULT 0;--> statement-breakpoint
ALTER TABLE `game_turns` ADD `milestones` json;--> statement-breakpoint
ALTER TABLE `game_turns` ADD `movers` json;