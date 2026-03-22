import { Injectable } from "@/decorators/injectable";
import { DatabaseRepository } from "./DatabaseRepository";
import { IUserRepository } from "./IUserRepository";
import { dependencyTokens } from "@/dependencies/tokens";
import { DrizzleDb, User, UserListItem } from "@psb/shared/types";
import { students, teachers, users } from "@psb/shared/schema";
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

    listUsers(limit = 5, offset = 0): Promise<UserListItem[]> {
        return this.db
            .select({
                id: users.id,
                name: users.name,
                role: users.role,
                nisn: students.nisn,
                staffId: teachers.staffId,
            })
            .from(users)
            .leftJoin(students, eq(users.id, students.userId))
            .leftJoin(teachers, eq(users.id, teachers.userId))
            .limit(limit)
            .offset(offset)
            .then((res) =>
                res.map((r) => ({
                    id: r.id,
                    name: r.name,
                    role: r.role,
                    identifier: r.nisn ?? r.staffId?.toString() ?? "N/A",
                })),
            );
    }
}
