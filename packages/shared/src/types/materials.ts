import { materials } from "../database/schema";
import { Subject } from "./subjects";

/**
 * The type of a material as stored in the database.
 */
export type Material = typeof materials.$inferSelect;

/**
 * An attachment entry as shown in the subject material detail page.
 */
export interface SubjectMaterialAttachment {
    readonly id: number;
    readonly name: string;
}

/**
 * The detailed data for a single material, displayed to students and teachers.
 */
export interface SubjectMaterial extends Omit<
    Material,
    "createdAt" | "lastUpdatedAt"
> {
    readonly subject: Pick<Subject, "id" | "code" | "name">;
    readonly createdAt: string;
    readonly lastUpdatedAt: string;
    readonly attachments: SubjectMaterialAttachment[];
}
