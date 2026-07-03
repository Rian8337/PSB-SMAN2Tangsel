import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { administrators, students, teachers, users } from "@psb/shared/schema";
import {
    DrizzleDb,
    Transaction,
    User,
    UserListItem,
    UserRole,
} from "@psb/shared/types";
import { and, eq, like, or, SQL } from "drizzle-orm";
import { inject } from "tsyringe";
import { DatabaseRepository } from "./DatabaseRepository";
import { IUserRepository } from "./IUserRepository";

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

    findByIdentifier(identifier: string): Promise<User | null> {
        return this.db
            .select()
            .from(users)
            .where(eq(users.identifier, identifier))
            .then((res) => res.at(0) ?? null);
    }

    listUsers(
        role?: UserRole,
        query?: string,
        limit = 5,
        offset = 0,
    ): Promise<UserListItem[]> {
        const whereConditions: (SQL | undefined)[] = [];

        if (role !== undefined) {
            whereConditions.push(eq(users.role, role));
        }

        if (query) {
            const searchParam = `%${query.trim()}%`;

            whereConditions.push(
                or(
                    like(users.name, searchParam),
                    like(users.identifier, searchParam),
                ),
            );
        }

        return this.db
            .select({
                id: users.id,
                name: users.name,
                role: users.role,
                active: users.active,
                identifier: users.identifier,
            })
            .from(users)
            .where(and(...whereConditions))
            .limit(limit)
            .offset(offset);
    }

    async create(
        name: string,
        passwordHash: string,
        role: UserRole,
        identifier: string,
    ) {
        await this.db.transaction(async (tx) => {
            const [userResult] = await tx.insert(users).values({
                name,
                password: passwordHash,
                role,
                identifier,
                active: true,
            });

            const userId = userResult.insertId;

            switch (role) {
                case UserRole.student:
                    await tx.insert(students).values({ userId });
                    break;

                case UserRole.teacher:
                    await tx.insert(teachers).values({ userId });
                    break;

                case UserRole.administrator:
                    await tx.insert(administrators).values({ userId });
                    break;

                default:
                    throw new Error("Invalid user role");
            }
        });
    }

    async update(userId: number, name: string, active: boolean) {
        await this.db
            .update(users)
            .set({ name, active })
            .where(eq(users.id, userId));
    }

    async updatePassword(userId: number, newPasswordHash: string) {
        await this.db
            .update(users)
            .set({ password: newPasswordHash })
            .where(eq(users.id, userId));
    }

    async delete(userId: number, tx?: Transaction) {
        const ctx = tx ?? this.db;

        await ctx.delete(users).where(eq(users.id, userId));
    }
}
