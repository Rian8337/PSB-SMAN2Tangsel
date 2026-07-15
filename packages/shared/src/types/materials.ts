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
    readonly downloadCount: number;
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

/**
 * Request body for creating a new material. Files are sent as multipart form data.
 */
export interface CreateMaterialRequest {
    readonly classSubjectId: number;
    readonly title: string;
    readonly description: string | null;
    readonly visible: boolean;
}

/**
 * Request body for updating an existing material. New files are sent as multipart form data.
 */
export interface UpdateMaterialRequest {
    readonly title: string;
    readonly description: string | null;
    readonly visible: boolean;
    readonly deletedAttachmentIds: number[];
    readonly renamedAttachments: SubjectMaterialAttachment[];
}
