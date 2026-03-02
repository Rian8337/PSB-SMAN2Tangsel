import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { DatabaseRepository } from "./DatabaseRepository";
import { ITeacherRepository } from "./ITeacherRepository";
import { DrizzleDb, Teacher } from "@psb/shared/types";
import { inject } from "tsyringe";
import { eq } from "drizzle-orm";
import { teachers } from "@psb/shared/schema";

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
        return this.db.query.teachers
            .findFirst({
                with: {
                    user: true,
                },
                where: eq(teachers.staffId, staffId),
            })
            .then((res) => {
                if (!res) {
                    return null;
                }

                return {
                    active: res.user.active,
                    id: res.user.id,
                    name: res.user.name,
                    password: res.user.password,
                    role: res.user.role,
                    staffId: res.staffId,
                    userId: res.userId,
                };
            });
    }
}
