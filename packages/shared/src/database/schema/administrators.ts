import { relations } from "drizzle-orm";
import { foreignKey, int, mysqlTable } from "drizzle-orm/mysql-core";
import { users } from "./users";

/**
 * The administrator table.
 */
export const administrators = mysqlTable(
    "administrator",
    {
        /**
         * The ID of the administrator, which is also the ID of the corresponding user in the {@link users} table.
         */
        userId: int().primaryKey(),

        /**
         * The school-issued staff ID of the administrator.
         */
        staffId: int().unique("staffid_unique").notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.userId],
            foreignColumns: [users.id],
            name: "fk_administrator_user",
        }).onDelete("cascade"),
    ],
);

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
