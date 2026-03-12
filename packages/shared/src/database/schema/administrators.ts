import { int, mysqlTable } from "drizzle-orm/mysql-core";
import { users } from "./users";
import { relations } from "drizzle-orm";

/**
 * The administrator table.
 */
export const administrators = mysqlTable("administrator", {
    /**
     * The ID of the administrator, which is also the ID of the corresponding user in the `user` table.
     */
    userId: int()
        .primaryKey()
        .references(() => users.id, { onDelete: "cascade" }),

    /**
     * The school-issued staff ID of the administrator.
     */
    staffId: int().unique("staffid_unique").notNull(),
});

/**
 * Relations for the {@link administrators} table.
 */
export const administratorRelations = relations(administrators, ({ one }) => ({
    /**
     * The user associated with the administrator.
     */
    user: one(users, {
        fields: [administrators.userId],
        references: [users.id],
    }),
}));
