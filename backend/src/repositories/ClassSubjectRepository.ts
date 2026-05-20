import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import {
    assignments,
    classSubjects,
    classes,
    materials,
    studentClasses,
    subjects,
    teachers,
    users,
} from "@psb/shared/schema";
import {
    ClassSubjectAssignment,
    DrizzleDb,
    Subject,
    SubjectDashboard,
    ValidSemester,
    ValidSession,
} from "@psb/shared/types";
import { and, asc, eq, like, notInArray, or } from "drizzle-orm";
import { inject } from "tsyringe";
import { DatabaseRepository } from "./DatabaseRepository";
import { IClassSubjectRepository } from "./IClassSubjectRepository";

/**
 * Defines operations for accessing and managing subject assignments to classes in the database.
 */
@Injectable(dependencyTokens.classSubjectRepository)
export class ClassSubjectRepository
    extends DatabaseRepository
    implements IClassSubjectRepository
{
    constructor(
        @inject(dependencyTokens.db)
        db: DrizzleDb,
    ) {
        super(db);
    }

    listAssignedSubjects(
        classId: number,
        query?: string,
        limit = 5,
        offset = 0,
    ): Promise<ClassSubjectAssignment[]> {
        const conditions = [eq(classSubjects.classId, classId)];

        if (query) {
            const searchPattern = `%${query}%`;

            conditions.push(
                or(
                    like(subjects.code, searchPattern),
                    like(subjects.name, searchPattern),
                    like(users.name, searchPattern),
                )!,
            );
        }

        return this.db
            .select({
                id: classSubjects.id,
                subject: {
                    id: subjects.id,
                    code: subjects.code,
                    name: subjects.name,
                    active: subjects.active,
                },
                teacher: {
                    id: users.id,
                    name: users.name,
                },
                class: {
                    id: classes.id,
                    name: classes.name,
                },
            })
            .from(classSubjects)
            .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
            .innerJoin(classes, eq(classSubjects.classId, classes.id))
            .leftJoin(teachers, eq(classSubjects.teacherId, teachers.userId))
            .leftJoin(users, eq(teachers.userId, users.id))
            .where(and(...conditions))
            .limit(limit)
            .offset(offset)
            .orderBy(asc(subjects.name));
    }

    async listAssignedSubjectsForTeacher(
        teacherId: number,
        session: ValidSession,
        semester: ValidSemester,
        query?: string,
        limit = 5,
        offset = 0,
    ): Promise<ClassSubjectAssignment[]> {
        const conditions = [
            eq(classSubjects.teacherId, teacherId),
            eq(classes.session, session),
            eq(classes.semester, semester),
        ];

        if (query) {
            const searchPattern = `%${query}%`;

            conditions.push(
                or(
                    like(subjects.code, searchPattern),
                    like(subjects.name, searchPattern),
                    like(classes.name, searchPattern),
                )!,
            );
        }

        return this.db
            .select({
                id: classSubjects.id,
                subject: {
                    id: subjects.id,
                    code: subjects.code,
                    name: subjects.name,
                },
                teacher: {
                    id: users.id,
                    name: users.name,
                },
                class: {
                    id: classes.id,
                    name: classes.name,
                },
            })
            .from(classSubjects)
            .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
            .innerJoin(classes, eq(classSubjects.classId, classes.id))
            .leftJoin(teachers, eq(classSubjects.teacherId, teachers.userId))
            .leftJoin(users, eq(teachers.userId, users.id))
            .where(and(...conditions))
            .limit(limit)
            .offset(offset)
            .orderBy(asc(subjects.name));
    }

    async listUnassignedSubjects(
        classId: number,
        query?: string,
        limit = 5,
        offset = 0,
    ): Promise<Subject[]> {
        const assignedSubjectIdsQuery = this.db
            .select({ id: classSubjects.subjectId })
            .from(classSubjects)
            .where(eq(classSubjects.classId, classId));

        const conditions = [
            eq(subjects.active, true),
            notInArray(subjects.id, assignedSubjectIdsQuery),
        ];

        if (query) {
            const searchPattern = `%${query}%`;

            conditions.push(
                or(
                    like(subjects.code, searchPattern),
                    like(subjects.name, searchPattern),
                )!,
            );
        }

        return this.db
            .select()
            .from(subjects)
            .where(and(...conditions))
            .limit(limit)
            .offset(offset)
            .orderBy(asc(subjects.name));
    }

    async assignSubject(
        classId: number,
        subjectId: number,
        teacherId: number | null,
    ): Promise<void> {
        await this.db.insert(classSubjects).values({
            classId,
            subjectId,
            teacherId,
        });
    }

    async updateAssignedSubject(
        classId: number,
        assignmentId: number,
        teacherId: number | null,
    ): Promise<void> {
        await this.db
            .update(classSubjects)
            .set({ teacherId })
            .where(
                and(
                    eq(classSubjects.id, assignmentId),
                    eq(classSubjects.classId, classId),
                ),
            );
    }

    async hasAssociatedContent(assignmentId: number): Promise<boolean> {
        const materialCount = await this.db
            .select({ id: materials.id })
            .from(materials)
            .where(eq(materials.classSubjectId, assignmentId))
            .limit(1);

        if (materialCount.length > 0) {
            return true;
        }

        const assignmentCount = await this.db
            .select({ id: assignments.id })
            .from(assignments)
            .where(eq(assignments.classSubjectId, assignmentId))
            .limit(1);

        return assignmentCount.length > 0;
    }

    async unassignSubject(
        classId: number,
        assignmentId: number,
    ): Promise<void> {
        await this.db
            .delete(classSubjects)
            .where(
                and(
                    eq(classSubjects.id, assignmentId),
                    eq(classSubjects.classId, classId),
                ),
            );
    }

    async getStudentDashboard(
        classSubjectId: number,
        studentId: number,
    ): Promise<SubjectDashboard | null> {
        const row = await this.db
            .select({
                subject: {
                    id: subjects.id,
                    code: subjects.code,
                    name: subjects.name,
                },
                class: {
                    id: classes.id,
                    name: classes.name,
                },
            })
            .from(classSubjects)
            .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
            .innerJoin(classes, eq(classSubjects.classId, classes.id))
            .innerJoin(
                studentClasses,
                and(
                    eq(studentClasses.classId, classSubjects.classId),
                    eq(studentClasses.studentId, studentId),
                ),
            )
            .where(eq(classSubjects.id, classSubjectId))
            .limit(1)
            .then((res) => res.at(0) ?? null);

        if (!row) {
            return null;
        }

        const [materialRows, assignmentRows] = await Promise.all([
            this.db
                .select({
                    id: materials.id,
                    title: materials.title,
                    description: materials.description,
                    visible: materials.visible,
                })
                .from(materials)
                .where(
                    and(
                        eq(materials.classSubjectId, classSubjectId),
                        eq(materials.visible, true),
                    ),
                )
                .orderBy(asc(materials.createdAt)),
            this.db
                .select({
                    id: assignments.id,
                    title: assignments.title,
                    visible: assignments.visible,
                })
                .from(assignments)
                .where(
                    and(
                        eq(assignments.classSubjectId, classSubjectId),
                        eq(assignments.visible, true),
                    ),
                )
                .orderBy(asc(assignments.createdAt)),
        ]);

        return {
            subject: row.subject,
            class: row.class,
            materials: materialRows,
            assignments: assignmentRows,
        };
    }

    async getTeacherDashboard(
        classSubjectId: number,
        teacherId: number,
    ): Promise<SubjectDashboard | null> {
        const row = await this.db
            .select({
                subject: {
                    id: subjects.id,
                    code: subjects.code,
                    name: subjects.name,
                },
                class: {
                    id: classes.id,
                    name: classes.name,
                },
            })
            .from(classSubjects)
            .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
            .innerJoin(classes, eq(classSubjects.classId, classes.id))
            .where(
                and(
                    eq(classSubjects.id, classSubjectId),
                    eq(classSubjects.teacherId, teacherId),
                ),
            )
            .limit(1)
            .then((res) => res.at(0) ?? null);

        if (!row) {
            return null;
        }

        const [materialRows, assignmentRows] = await Promise.all([
            this.db
                .select({
                    id: materials.id,
                    title: materials.title,
                    description: materials.description,
                    visible: materials.visible,
                })
                .from(materials)
                .where(eq(materials.classSubjectId, classSubjectId))
                .orderBy(asc(materials.createdAt)),
            this.db
                .select({
                    id: assignments.id,
                    title: assignments.title,
                    visible: assignments.visible,
                })
                .from(assignments)
                .where(eq(assignments.classSubjectId, classSubjectId))
                .orderBy(asc(assignments.createdAt)),
        ]);

        return {
            subject: row.subject,
            class: row.class,
            materials: materialRows,
            assignments: assignmentRows,
        };
    }
}
