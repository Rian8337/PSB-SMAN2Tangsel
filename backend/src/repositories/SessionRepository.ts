import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { sessions } from "@psb/shared/schema";
import {
    AcademicSession,
    DrizzleDb,
    ValidSemester,
    ValidSession,
} from "@psb/shared/types";
import { and, desc, eq, isNull } from "drizzle-orm";
import { inject } from "tsyringe";
import { DatabaseRepository } from "./DatabaseRepository";
import { ISessionRepository } from "./ISessionRepository";

/**
 * Defines operations for accessing and managing academic session data in the database.
 */
@Injectable(dependencyTokens.sessionRepository)
export class SessionRepository
    extends DatabaseRepository
    implements ISessionRepository
{
    constructor(
        @inject(dependencyTokens.db)
        db: DrizzleDb,
    ) {
        super(db);
    }

    getActive(): Promise<AcademicSession | null> {
        return this.db
            .select()
            .from(sessions)
            .where(eq(sessions.active, true))
            .then((res) => res.at(0) ?? null);
    }

    get(
        session: ValidSession,
        semester: ValidSemester,
    ): Promise<AcademicSession | null> {
        return this.db
            .select()
            .from(sessions)
            .where(
                and(
                    eq(sessions.session, session),
                    eq(sessions.semester, semester),
                ),
            )
            .then((res) => res.at(0) ?? null);
    }

    list(query?: string, limit = 5, offset = 0): Promise<AcademicSession[]> {
        let builder = this.db.select().from(sessions);

        if (query) {
            builder = builder.where(
                eq(sessions.session, query as ValidSession),
            ) as typeof builder;
        } else {
            // If there is no query, we want to order by start time and active status to show the most relevant sessions first.
            builder = builder.orderBy(
                desc(sessions.startTime),
                desc(sessions.active),
            ) as typeof builder;
        }

        return builder.limit(limit).offset(offset);
    }

    async create(
        session: ValidSession,
        semester: ValidSemester,
        startTime: Date,
        endTime: Date,
        active: boolean,
    ): Promise<void> {
        await this.db.transaction(async (tx) => {
            if (active) {
                // Deactivate any currently active session.
                await tx
                    .update(sessions)
                    .set({ active: null })
                    .where(eq(sessions.active, true));
            }

            await tx.insert(sessions).values({
                session,
                semester,
                startTime,
                endTime,
                active: active ? true : null,
            });
        });
    }

    async update(
        session: ValidSession,
        semester: ValidSemester,
        startTime: Date,
        endTime: Date,
        active: boolean,
    ): Promise<void> {
        await this.db.transaction(async (tx) => {
            if (active) {
                // Deactivate any currently active session.
                await tx
                    .update(sessions)
                    .set({ active: null })
                    .where(eq(sessions.active, true));
            }

            await tx
                .update(sessions)
                .set({
                    startTime,
                    endTime,
                    active: active ? true : null,
                })
                .where(
                    and(
                        eq(sessions.session, session),
                        eq(sessions.semester, semester),
                    ),
                );
        });
    }

    async delete(
        session: ValidSession,
        semester: ValidSemester,
    ): Promise<void> {
        // TODO: delete all data related to this session that are not stored in the database (e.g., attachments in the file system)
        await this.db
            .delete(sessions)
            .where(
                and(
                    eq(sessions.session, session),
                    eq(sessions.semester, semester),
                    isNull(sessions.active),
                ),
            );
    }
}
