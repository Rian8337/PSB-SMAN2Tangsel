import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { classes, studentClasses, students, users } from "@psb/shared/schema";
import {
    Class,
    DrizzleDb,
    UserListItem,
    UserRole,
    ValidSemester,
    ValidSession,
} from "@psb/shared/types";
import { and, eq, like, notExists, or, sql, SQL } from "drizzle-orm";
import { inject } from "tsyringe";
import { DatabaseRepository } from "./DatabaseRepository";
import { IClassStudentRepository } from "./IClassStudentRepository";

/**
 * Defines operations for accessing and managing student enrollments to classes in the database.
 */
@Injectable(dependencyTokens.classStudentRepository)
export class ClassStudentRepository
    extends DatabaseRepository
    implements IClassStudentRepository
{
    constructor(
        @inject(dependencyTokens.db)
        db: DrizzleDb,
    ) {
        super(db);
    }

    getEnrolledStudents(
        classId: number,
        query?: string,
        limit = 5,
        offset = 0,
    ): Promise<UserListItem[]> {
        const filters: (SQL | undefined)[] = [
            eq(studentClasses.classId, classId),
        ];

        if (query) {
            const searchParam = `%${query.trim()}%`;

            filters.push(
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
            .from(studentClasses)
            .innerJoin(students, eq(studentClasses.studentId, students.userId))
            .innerJoin(users, eq(students.userId, users.id))
            .where(eq(studentClasses.classId, classId))
            .limit(limit)
            .offset(offset);
    }

    getUnenrolledStudents(
        session: ValidSession,
        semester: ValidSemester,
        query?: string,
        limit = 5,
        offset = 0,
    ): Promise<UserListItem[]> {
        // For each student, check if an enrollment exists in the target session/semester.
        const filters: (SQL | undefined)[] = [
            notExists(
                this.db
                    .select({ dummy: sql`1` })
                    .from(studentClasses)
                    .innerJoin(classes, eq(studentClasses.classId, classes.id))
                    .where(
                        and(
                            eq(classes.session, session),
                            eq(classes.semester, semester),
                            eq(studentClasses.studentId, students.userId),
                        ),
                    ),
            ),
        ];

        if (query) {
            const searchParam = `%${query.trim()}%`;

            filters.push(
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
            .from(students)
            .innerJoin(
                users,
                and(
                    eq(students.userId, users.id),
                    eq(users.role, UserRole.student),
                    eq(users.active, true),
                ),
            )
            .where(and(...filters))
            .limit(limit)
            .offset(offset);
    }

    findActiveEnrollment(
        studentId: number,
        session: ValidSession,
        semester: ValidSemester,
    ): Promise<Class | null> {
        return this.db
            .select({
                id: classes.id,
                name: classes.name,
                session: classes.session,
                semester: classes.semester,
            })
            .from(studentClasses)
            .innerJoin(classes, eq(studentClasses.classId, classes.id))
            .where(
                and(
                    eq(studentClasses.studentId, studentId),
                    eq(classes.session, session),
                    eq(classes.semester, semester),
                ),
            )
            .limit(1)
            .then((res) => res.at(0) ?? null);
    }

    async enrollStudent(classId: number, studentId: number) {
        await this.db.insert(studentClasses).values({ classId, studentId });
    }

    async unenrollStudent(classId: number, studentId: number) {
        await this.db
            .delete(studentClasses)
            .where(
                and(
                    eq(studentClasses.classId, classId),
                    eq(studentClasses.studentId, studentId),
                ),
            );
    }
}
