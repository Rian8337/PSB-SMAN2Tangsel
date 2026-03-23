import { Injectable } from "@/decorators/injectable";
import { DatabaseRepository } from "./DatabaseRepository";
import { IUserRepository } from "./IUserRepository";
import { dependencyTokens } from "@/dependencies/tokens";
import { DrizzleDb, User, UserListItem, UserRole } from "@psb/shared/types";
import { administrators, students, teachers, users } from "@psb/shared/schema";
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

    async create(
        name: string,
        passwordHash: string,
        role: UserRole,
        identifier: string,
    ): Promise<void> {
        await this.db.transaction(async (tx) => {
            const [userResult] = await tx.insert(users).values({
                name,
                password: passwordHash,
                role,
                active: true,
            });

            const userId = userResult.insertId;

            switch (role) {
                case UserRole.student:
                    await tx.insert(students).values({
                        userId,
                        nisn: identifier,
                    });
                    break;

                case UserRole.teacher:
                    await tx.insert(teachers).values({
                        userId,
                        staffId: parseInt(identifier, 10),
                    });
                    break;

                case UserRole.administrator:
                    await tx.insert(administrators).values({
                        userId,
                        staffId: parseInt(identifier, 10),
                    });
                    break;

                default:
                    throw new Error("Invalid user role");
            }
        });
    }

    async updatePassword(
        userId: number,
        newPasswordHash: string,
    ): Promise<void> {
        await this.db
            .update(users)
            .set({ password: newPasswordHash })
            .where(eq(users.id, userId));
    }
}
