import { relations, sql } from "drizzle-orm";
import {
    datetime,
    foreignKey,
    int,
    mysqlTable,
    primaryKey,
} from "drizzle-orm/mysql-core";
import { materials } from "./materials";
import { users } from "./users";

/**
 * The material bookmark table, which represents the many-to-many relationship between users and materials.
 *
 * This represents the materials that a student or teacher has bookmarked for quick access.
 */
export const materialBookmarks = mysqlTable(
    "material_bookmark",
    {
        /**
         * The ID of the user who bookmarked the material, which is also the ID of the corresponding user
         * in the {@link users} table.
         */
        userId: int().notNull(),

        /**
         * The ID of the bookmarked material, which is also the ID of the corresponding material in the
         * {@link materials} table.
         */
        materialId: int().notNull(),

        /**
         * The time at which this bookmark was created.
         *
         * Uses millisecond precision (unlike most other timestamp columns in this schema) because
         * bookmarks are ordered by recency, and whole-second resolution can tie when two bookmarks
         * are created in quick succession.
         */
        createdAt: datetime({ fsp: 3 })
            .default(sql`(now(3))`)
            .notNull(),
    },
    (table) => [
        primaryKey({ columns: [table.userId, table.materialId] }),
        foreignKey({
            columns: [table.userId],
            foreignColumns: [users.id],
            name: "fk_material_bookmark_user",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.materialId],
            foreignColumns: [materials.id],
            name: "fk_material_bookmark_material",
        }).onDelete("cascade"),
    ],
);

/**
 * Relations for the {@link materialBookmarks} table.
 */
export const materialBookmarkRelations = relations(
    materialBookmarks,
    ({ one }) => ({
        /**
         * The user who bookmarked the material.
         */
        user: one(users, {
            fields: [materialBookmarks.userId],
            references: [users.id],
        }),

        /**
         * The bookmarked material.
         */
        material: one(materials, {
            fields: [materialBookmarks.materialId],
            references: [materials.id],
        }),
    }),
);
