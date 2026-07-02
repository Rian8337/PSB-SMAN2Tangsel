import { relations } from "drizzle-orm";
import {
    boolean,
    foreignKey,
    int,
    mysqlTable,
    text,
    timestamp,
} from "drizzle-orm/mysql-core";
import { classSubjects } from "./classSubjects";
import { materialAttachments } from "./materialAttachments";

/**
 * The materials table.
 *
 * This represents the teaching material of a class for a specific subject.
 */
export const materials = mysqlTable(
    "material",
    {
        /**
         * The system-issued identification number of this material.
         */
        id: int().autoincrement().primaryKey(),

        /**
         * The ID of the class subject this material is associated with, which is also the ID of the
         * corresponding class subject in the {@link classSubjects} table.
         */
        classSubjectId: int().notNull(),

        /**
         * The time at which this material was created.
         */
        createdAt: timestamp().defaultNow().notNull(),

        /**
         * The description of this material.
         */
        description: text(),

        /**
         * The time at which this material was last updated.
         */
        lastUpdatedAt: timestamp().defaultNow().onUpdateNow().notNull(),

        /**
         * The title of this material.
         */
        title: text().notNull(),

        /**
         * Whether this material is visible to students.
         */
        visible: boolean().default(false).notNull(),
    },
    (table) => [
        foreignKey({
            columns: [table.classSubjectId],
            foreignColumns: [classSubjects.id],
            name: "fk_material_class_subject",
        }).onDelete("cascade"),
    ],
);

/**
 * Relations for the {@link materials} table.
 */
export const materialRelations = relations(materials, ({ one, many }) => ({
    /**
     * The attachments belonging to this material.
     */
    attachments: many(materialAttachments),

    /**
     * The class subject associated with the material.
     */
    classSubject: one(classSubjects, {
        fields: [materials.classSubjectId],
        references: [classSubjects.id],
    }),
}));
