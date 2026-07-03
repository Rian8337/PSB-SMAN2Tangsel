import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { attachments } from "@psb/shared/schema";
import { DrizzleDb } from "@psb/shared/types";
import { eq, inArray } from "drizzle-orm";
import { inject } from "tsyringe";
import { DatabaseRepository } from "./DatabaseRepository";
import {
    AttachmentRecord,
    IAttachmentRepository,
} from "./IAttachmentRepository";

/**
 * Provides operations for managing attachment records in the database.
 */
@Injectable(dependencyTokens.attachmentRepository)
export class AttachmentRepository
    extends DatabaseRepository
    implements IAttachmentRepository
{
    constructor(
        @inject(dependencyTokens.db)
        db: DrizzleDb,
    ) {
        super(db);
    }

    async create(name: string, path: string): Promise<AttachmentRecord> {
        const [result] = await this.db
            .insert(attachments)
            .values({ name, path });

        return { id: result.insertId, name, path };
    }

    async getByIds(ids: number[]): Promise<AttachmentRecord[]> {
        if (ids.length === 0) {
            return [];
        }

        return this.db
            .select({
                id: attachments.id,
                name: attachments.name,
                path: attachments.path,
            })
            .from(attachments)
            .where(inArray(attachments.id, ids));
    }

    async updateNameAndPath(id: number, newName: string, newPath: string) {
        await this.db
            .update(attachments)
            .set({ name: newName, path: newPath })
            .where(eq(attachments.id, id));
    }

    async deleteByIds(ids: number[]) {
        if (ids.length === 0) {
            return;
        }

        await this.db.delete(attachments).where(inArray(attachments.id, ids));
    }
}
