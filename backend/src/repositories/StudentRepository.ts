import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { LoginResult, StudentSessionData } from "@/types";
import { classes, studentClasses, students, users } from "@psb/shared/schema";
import { DrizzleDb, Student, UserRole } from "@psb/shared/types";
import { eq } from "drizzle-orm";
import { inject } from "tsyringe";
import { DatabaseRepository } from "./DatabaseRepository";
import { IStudentRepository } from "./IStudentRepository";

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

    getLoginData(
        nisn: string,
    ): Promise<LoginResult<Student, StudentSessionData> | null> {
        return this.db
            .select({
                user: users,
                classId: classes.id,
            })
            .from(students)
            .innerJoin(users, eq(students.userId, users.id))
            .innerJoin(
                studentClasses,
                eq(studentClasses.studentId, students.userId),
            )
            .innerJoin(classes, eq(classes.id, studentClasses.classId))
            .where(eq(students.nisn, nisn))
            .limit(1)
            .then((res) => {
                const data = res.at(0);

                if (!data) {
                    return null;
                }

                return {
                    user: {
                        active: data.user.active,
                        id: data.user.id,
                        name: data.user.name,
                        nisn,
                        password: data.user.password,
                        role: data.user.role,
                        userId: data.user.id,
                    },
                    sessionData: {
                        classId: data.classId,
                        nisn,
                        role: UserRole.student,
                        userId: data.user.id,
                    },
                } satisfies LoginResult<Student, StudentSessionData>;
            });
    }
}
