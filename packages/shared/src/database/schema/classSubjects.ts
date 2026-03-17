import { relations } from "drizzle-orm";
import { foreignKey, int, mysqlTable } from "drizzle-orm/mysql-core";
import { classes } from "./classes";
import { materials } from "./materials";
import { schedules } from "./schedules";
import { subjects } from "./subjects";
import { teachers } from "./teachers";

/**
 * The class subject table, which represents the many-to-many relationship between classes and subjects.
 *
 * This represents the subjects that are taught in a class.
 */
export const classSubjects = mysqlTable(
    "class_subject",
    {
        /**
         * The system-issued identification number of the class subject.
         */
        id: int().autoincrement().primaryKey(),

        /**
         * The ID of the class, which is also the ID of the corresponding class in the {@link classes} table.
         */
        classId: int().notNull(),

        /**
         * The ID of the subject, which is also the ID of the corresponding subject in the {@link subjects} table.
         */
        subjectId: int().notNull(),

        /**
         * The ID of the teacher that teaches the subject in the class, which is also the ID of the corresponding
         * teacher in the {@link teachers} table.
         */
        teacherId: int(),
    },
    (table) => [
        foreignKey({
            columns: [table.classId],
            foreignColumns: [classes.id],
            name: "fk_class_subject_class",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.subjectId],
            foreignColumns: [subjects.id],
            name: "fk_class_subject_subject",
        }).onDelete("cascade"),
        foreignKey({
            columns: [table.teacherId],
            foreignColumns: [teachers.userId],
            name: "fk_class_subject_teacher",
        }).onDelete("set null"),
    ],
);

/**
 * Relations for the {@link classSubjects} table.
 */
export const classSubjectRelations = relations(
    classSubjects,
    ({ one, many }) => ({
        /**
         * The class associated with the class subject.
         */
        class: one(classes, {
            fields: [classSubjects.classId],
            references: [classes.id],
        }),

        /**
         * The teaching materials of the class subject.
         */
        materials: many(materials),

        /**
         * The teaching schedules of the class subject.
         */
        schedules: many(schedules),

        /**
         * The subject associated with the class subject.
         */
        subject: one(subjects, {
            fields: [classSubjects.subjectId],
            references: [subjects.id],
        }),

        /**
         * The teacher associated with the class subject.
         *
         * This can be null if the teacher is deleted, because we want to keep any
         * class subject data even if the teacher is deleted.
         */
        teacher: one(teachers, {
            fields: [classSubjects.teacherId],
            references: [teachers.userId],
        }),
    }),
);
