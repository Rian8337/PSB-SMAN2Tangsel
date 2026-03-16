import { Injectable } from "@/decorators/injectable";
import { DatabaseRepository } from "./DatabaseRepository";
import { IUserRepository } from "./IUserRepository";
import { dependencyTokens } from "@/dependencies/tokens";
import { DrizzleDb, User } from "@psb/shared/types";
import { users } from "@psb/shared/schema";
import { eq } from "drizzle-orm";
import { inject } from "tsyringe";

/**
 * Defines operations for accessing and managing user data in the database.
 */
@Injectable(dependencyTokens.userRepository)
export class UserRepository
    extends DatabaseRepository
    implements IUserRepository
{
    constructor(
        @inject(dependencyTokens.db)
        db: DrizzleDb,
    ) {
        super(db);
    }

    findById(id: number): Promise<User | null> {
        return this.db
            .select()
            .from(users)
            .where(eq(users.id, id))
            .then((res) => res.at(0) ?? null);
    }
}
