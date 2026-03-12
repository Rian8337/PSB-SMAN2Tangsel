import {
    boolean,
    int,
    mysqlTable,
    text,
    timestamp,
} from "drizzle-orm/mysql-core";
import { classSubjects } from "./classSubjects";
import { relations } from "drizzle-orm";
import { assignmentSubmissions } from "./assignmentSubmissions";
import { assignmentAttachments } from "./assignmentAttachments";

/**
 * The assignments table.
 */
export const assignments = mysqlTable("assignment", {
    /**
     * The system-issued identification number of the assignment.
     */
    id: int().autoincrement().primaryKey(),

    /**
     * The ID of the class subject this assignment is associated with, which is also the ID of the
     * corresponding class subject in the {@link classSubjects} table.
     */
    classSubjectId: int().references(() => classSubjects.id, {
        onDelete: "cascade",
    }),

    /**
     * The time at which this assignment was created.
     */
    createdAt: timestamp().defaultNow().notNull(),

    /**
     * The description of this assignment.
     */
    description: text(),

    /**
     * The time at which this assignment was last updated.
     */
    lastUpdatedAt: timestamp().defaultNow().notNull(),

    /**
     * The title of this assignment.
     */
    title: text().notNull(),

    /**
     * Whether this assignment is visible to students.
     */
    visible: boolean().default(false).notNull(),
});

/**
 * Relations for the {@link assignments} table.
 */
export const assignmentRelations = relations(assignments, ({ one, many }) => ({
    /**
     * The attachments of this assignment.
     */
    attachments: many(assignmentAttachments),

    /**
     * The class subject associated with this assignment.
     */
    classSubject: one(classSubjects, {
        fields: [assignments.classSubjectId],
        references: [classSubjects.id],
    }),

    /**
     * The submissions of this assignment.
     */
    submissions: many(assignmentSubmissions),
}));
