import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { teachers, users } from "@psb/shared/schema";
import { DrizzleDb, Teacher } from "@psb/shared/types";
import { eq } from "drizzle-orm";
import { inject } from "tsyringe";
import { DatabaseRepository } from "./DatabaseRepository";
import { ITeacherRepository } from "./ITeacherRepository";

/**
 * Defines operations for accessing and managing teacher data in the database.
 */
@Injectable(dependencyTokens.teacherRepository)
export class TeacherRepository
    extends DatabaseRepository
    implements ITeacherRepository
{
    constructor(
        @inject(dependencyTokens.db)
        db: DrizzleDb,
    ) {
        super(db);
    }

    findByStaffId(staffId: number): Promise<Teacher | null> {
        return this.db
            .select({
                user: users,
                teacher: teachers,
            })
            .from(teachers)
            .innerJoin(users, eq(teachers.userId, users.id))
            .where(eq(teachers.staffId, staffId))
            .limit(1)
            .then((result) => {
                const res = result.at(0);

                if (!res) {
                    return null;
                }

                return {
                    active: res.user.active,
                    id: res.user.id,
                    name: res.user.name,
                    password: res.user.password,
                    role: res.user.role,
                    staffId: res.teacher.staffId,
                    userId: res.teacher.userId,
                };
            });
    }
}
