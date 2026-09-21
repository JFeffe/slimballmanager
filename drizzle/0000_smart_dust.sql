CREATE TABLE `relay_commands` (
	`seq` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`room` text NOT NULL,
	`actor` text NOT NULL,
	`command_id` text NOT NULL,
	`payload` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `command_identity` ON `relay_commands` (`room`,`actor`,`command_id`);--> statement-breakpoint
CREATE INDEX `command_room` ON `relay_commands` (`room`,`seq`);--> statement-breakpoint
CREATE TABLE `relay_presence` (
	`room` text NOT NULL,
	`actor` text NOT NULL,
	`seen` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `presence_identity` ON `relay_presence` (`room`,`actor`);--> statement-breakpoint
CREATE TABLE `relay_rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`keys_json` text NOT NULL,
	`snapshot` text NOT NULL,
	`revision` integer NOT NULL,
	`expires` integer NOT NULL,
	`host_seen` integer NOT NULL,
	`owner_ip` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `rooms_expiry` ON `relay_rooms` (`expires`);