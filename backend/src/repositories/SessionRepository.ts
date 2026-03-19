import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { sessions } from "@psb/shared/schema";
import { AcademicSession, DrizzleDb } from "@psb/shared/types";
import { eq } from "drizzle-orm";
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
}
