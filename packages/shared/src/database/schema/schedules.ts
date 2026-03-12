import { relations } from "drizzle-orm";
import { int, mysqlTable, timestamp, tinyint } from "drizzle-orm/mysql-core";
import { ScheduleDay } from "../../types";
import { classSubjects } from "./classSubjects";

/**
 * The schedule table.
 *
 * This represents the teaching schedule of a class for a specific subject.
 */
export const schedules = mysqlTable("schedule", {
    /**
     * The system-issued identification number of the schedule.
     */
    id: int().autoincrement().primaryKey(),

    /**
     * The ID of the class subject this schedule is associated with, which is also the ID of the
     * corresponding class subject in the {@link classSubjects} table.
     */
    classSubjectId: int()
        .references(() => classSubjects.id, { onDelete: "cascade" })
        .notNull(),

    /**
     * The day of the schedule, represented as a number from 0 to 6, where 0 is Sunday and 6 is Saturday.
     */
    day: tinyint().$type<ScheduleDay>().notNull(),

    /**
     * The time at which the schedule starts.
     *
     * Note that the day represented by this timestamp is ignored, and only the time is used. The day
     * of the schedule is determined by the {@link day} field.
     */
    startTime: timestamp().notNull(),

    /**
     * The time at which the schedule ends.
     *
     * Note that the day represented by this timestamp is ignored, and only the time is used. The day
     * of the schedule is determined by the {@link day} field.
     */
    endTime: timestamp().notNull(),
});

/**
 * Relations for the {@link schedules} table.
 */
export const scheduleRelations = relations(schedules, ({ one }) => ({
    /**
     * The class subject associated with the schedule.
     */

    classSubject: one(classSubjects, {
        fields: [schedules.classSubjectId],
        references: [classSubjects.id],
    }),
}));
