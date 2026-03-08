import { dependencyTokens } from "@/dependencies/tokens";
import { students, users } from "@psb/shared/schema";
import { DrizzleDb, Student } from "@psb/shared/types";
import { eq } from "drizzle-orm";
import { inject } from "tsyringe";
import { DatabaseRepository } from "./DatabaseRepository";
import { IStudentRepository } from "./IStudentRepository";
import { Injectable } from "@/decorators/injectable";

/**
 * Defines operations for accessing and managing student data in the database.
 */
@Injectable(dependencyTokens.studentRepository)
export class StudentRepository
    extends DatabaseRepository
    implements IStudentRepository
{
    constructor(
        @inject(dependencyTokens.db)
        db: DrizzleDb,
    ) {
        super(db);
    }

    findByNISN(nisn: string): Promise<Student | null> {
        return this.db
            .select({
                user: users,
                student: students,
            })
            .from(students)
            .innerJoin(users, eq(students.userId, users.id))
            .where(eq(students.nisn, nisn))
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
                    nisn: res.student.nisn,
                    password: res.user.password,
                    role: res.user.role,
                    userId: res.student.userId,
                };
            });
    }
}
