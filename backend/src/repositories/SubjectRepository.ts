import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { classSubjects, subjects } from "@psb/shared/schema";
import { DrizzleDb, Subject } from "@psb/shared/types";
import { eq, like, or } from "drizzle-orm";
import { inject } from "tsyringe";
import { DatabaseRepository } from "./DatabaseRepository";
import { ISubjectRepository } from "./ISubjectRepository";

/**
 * Provides operations for accessing and managing subject data in the database.
 */
@Injectable(dependencyTokens.subjectRepository)
export class SubjectRepository
    extends DatabaseRepository
    implements ISubjectRepository
{
    constructor(
        @inject(dependencyTokens.db)
        db: DrizzleDb,
    ) {
        super(db);
    }

    getById(id: number): Promise<Subject | null> {
        return this.db
            .select()
            .from(subjects)
            .where(eq(subjects.id, id))
            .then((rows) => rows.at(0) ?? null);
    }

    getByCode(code: string): Promise<Subject | null> {
        return this.db
            .select()
            .from(subjects)
            .where(eq(subjects.code, code))
            .then((rows) => rows.at(0) ?? null);
    }

    list(query?: string, limit = 5, offset = 0): Promise<Subject[]> {
        let builder = this.db.select().from(subjects);

        if (query) {
            const likeQuery = `%${query}%`;

            builder = builder.where(
                or(
                    like(subjects.code, likeQuery),
                    like(subjects.name, likeQuery),
                ),
            ) as typeof builder;
        }

        return builder.limit(limit).offset(offset);
    }

    async create(code: string, name: string): Promise<void> {
        await this.db.insert(subjects).values({ code, name });
    }

    async update(
        id: number,
        code: string,
        name: string,
        active: boolean,
    ): Promise<void> {
        await this.db
            .update(subjects)
            .set({ code, name, active })
            .where(eq(subjects.id, id));
    }

    hasClasses(id: number): Promise<boolean> {
        return this.db
            .select()
            .from(classSubjects)
            .where(eq(classSubjects.subjectId, id))
            .limit(1)
            .then((rows) => rows.length > 0);
    }

    async delete(id: number): Promise<void> {
        await this.db.delete(subjects).where(eq(subjects.id, id));
    }
}
