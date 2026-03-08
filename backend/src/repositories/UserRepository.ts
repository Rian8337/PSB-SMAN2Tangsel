import { Injectable } from "@/decorators/injectable";
import { DatabaseRepository } from "./DatabaseRepository";
import { IUserRepository } from "./IUserRepository";
import { dependencyTokens } from "@/dependencies/tokens";
import { User } from "@psb/shared/types";
import { users } from "@psb/shared/schema";
import { eq } from "drizzle-orm";

/**
 * Defines operations for accessing and managing user data in the database.
 */
@Injectable(dependencyTokens.userRepository)
export class UserRepository
    extends DatabaseRepository
    implements IUserRepository
{
    findById(id: number): Promise<User | null> {
        return this.db
            .select()
            .from(users)
            .where(eq(users.id, id))
            .then((res) => res.at(0) ?? null);
    }
}
