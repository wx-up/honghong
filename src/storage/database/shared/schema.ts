import { pgTable, serial, timestamp, index, pgPolicy, text, unique, varchar, foreignKey, check, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const blogPosts = pgTable("blog_posts", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	summary: text().notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("blog_posts_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	pgPolicy("blog_posts_允许公开删除", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("blog_posts_允许公开更新", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("blog_posts_允许公开写入", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("blog_posts_允许公开读取", { as: "permissive", for: "select", to: ["public"] }),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	username: varchar({ length: 50 }).notNull(),
	password: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("users_username_idx").using("btree", table.username.asc().nullsLast().op("text_ops")),
	unique("users_username_key").on(table.username),
	pgPolicy("users_public_select", { as: "permissive", for: "select", to: ["public"], using: sql`true` }),
	pgPolicy("users_public_insert", { as: "permissive", for: "insert", to: ["public"] }),
]);

export const gameRecords = pgTable("game_records", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	scenario: varchar({ length: 100 }).notNull(),
	finalScore: integer("final_score").notNull(),
	result: varchar({ length: 20 }).notNull(),
	playedAt: timestamp("played_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("game_records_played_at_idx").using("btree", table.playedAt.desc().nullsFirst().op("timestamptz_ops")),
	index("game_records_user_id_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "game_records_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("game_records_允许删除", { as: "permissive", for: "delete", to: ["public"], using: sql`true` }),
	pgPolicy("game_records_允许查看", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("game_records_允许插入", { as: "permissive", for: "insert", to: ["public"] }),
	check("game_records_result_check", sql`(result)::text = ANY ((ARRAY['success'::character varying, 'failure'::character varying])::text[])`),
]);
