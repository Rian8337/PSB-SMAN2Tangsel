import { AnyMySqlTable } from "drizzle-orm/mysql-core";
import * as schema from "../database/schema";
import { DrizzleDb, UserRole } from "../types";

//#region Global Database Seeding

type Insert<T extends AnyMySqlTable> = T["$inferInsert"];

// Hash for password123, 12 rounds
const testPasswordHash =
    "$2a$12$qwDcGIMf0xiOI5W5JhxM3eVWi5YnuCr9vsmq4S0quIbroKo12npZ2";

/**
 * The seeded data for primary tables.
 */
export const seededPrimaryData = {
    /**
     * The seeded administrators.
     */
    administrators: [
        {
            userId: 1,
            staffId: 1,
        },
    ] as const satisfies readonly Insert<typeof schema.administrators>[],

    /**
     * The seeded attachments.
     */
    attachments: [
        {
            name: "Test Attachment",
            path: "test_attachment.txt",
            id: 1,
        },
    ] as const satisfies readonly Insert<typeof schema.attachments>[],

    /**
     * The seeded sessions.
     */
    sessions: [
        {
            session: "2023/2024",
            semester: 2,
            startTime: new Date("2024-02-01"),
            endTime: new Date("2024-06-30"),
        },
        {
            session: "2023/2024",
            semester: 1,
            startTime: new Date("2023-09-01"),
            endTime: new Date("2024-01-31"),
        },
    ] as const satisfies readonly Insert<typeof schema.sessions>[],

    /**
     * The seeded subjects.
     */
    subjects: [
        {
            id: 1,
            code: "MA1",
            name: "Matematika Wajib",
        },
        {
            id: 2,
            code: "MA2",
            name: "Matematika Peminatan",
        },
    ] as const satisfies readonly Insert<typeof schema.subjects>[],

    /**
     * The seeded students.
     */
    students: [
        {
            nisn: "0012345678",
            userId: 3,
        },
        {
            nisn: "0012345679",
            userId: 4,
        },
    ] as const satisfies readonly Insert<typeof schema.students>[],

    /**
     * The seeded teachers.
     */
    teachers: [
        {
            userId: 2,
            staffId: 2,
        },
    ] as const satisfies readonly Insert<typeof schema.teachers>[],

    /**
     * The seeded users.
     */
    users: [
        {
            active: true,
            id: 1,
            name: "Administrator",
            password: testPasswordHash,
            role: UserRole.administrator,
        },
        {
            active: true,
            name: "Teacher",
            id: 2,
            password: testPasswordHash,
            role: UserRole.teacher,
        },
        {
            active: true,
            name: "Active Student",
            id: 3,
            password: testPasswordHash,
            role: UserRole.student,
        },
        {
            active: false,
            name: "Inactive Student",
            id: 4,
            password: testPasswordHash,
            role: UserRole.student,
        },
    ] as const satisfies readonly Insert<typeof schema.users>[],
} as const;

//#endregion

//#region Database Manager

interface TableSeeder<T extends AnyMySqlTable> {
    /**
     * Seeds the database with a single record for the given table.
     *
     * @param value The value to seed into the table.
     * @returns The seeded value.
     */
    readonly seedOne: (value: Insert<T>) => Promise<Insert<T>>;

    /**
     * Seeds the database with multiple records for the given table.
     *
     * @param values The values to seed into the table.
     * @returns The seeded values.
     */
    readonly seedMany: (...values: Insert<T>[]) => Promise<Insert<T>[]>;
}

/**
 * Creates a database manager for the given Drizzle database instance. Primarily used for testing.
 *
 * @param db The Drizzle database instance to create the manager for.
 * @returns The database manager for the given Drizzle database instance.
 */
export function createDatabaseManager(db: DrizzleDb) {
    function createSeeder<T extends AnyMySqlTable>(table: T): TableSeeder<T> {
        return {
            seedOne: async (value) => {
                await db.insert(table).values(value);

                return value;
            },

            seedMany: async (...values) => {
                await db.insert(table).values(values);

                return values;
            },
        };
    }

    return {
        /**
         * Seeds primary tables ({@link schema.administrators}, {@link schema.attachments}, {@link schema.sessions},
         * {@link schema.subjects}, {@link schema.students}, {@link schema.teachers}, and {@link schema.users})
         * with {@link seededPrimaryData}.
         *
         * Additional data can be seeded by calling the respective {@link seeders}.
         */
        seedPrimaryTables: async () => {
            await db.transaction(async (tx) => {
                await tx
                    .insert(schema.attachments)
                    .values(seededPrimaryData.attachments.slice());

                await tx
                    .insert(schema.sessions)
                    .values(seededPrimaryData.sessions.slice());

                await tx
                    .insert(schema.subjects)
                    .values(seededPrimaryData.subjects.slice());

                await tx
                    .insert(schema.users)
                    .values(seededPrimaryData.users.slice());

                await tx
                    .insert(schema.administrators)
                    .values(seededPrimaryData.administrators.slice());

                await tx
                    .insert(schema.teachers)
                    .values(seededPrimaryData.teachers.slice());

                await tx
                    .insert(schema.students)
                    .values(seededPrimaryData.students.slice());
            });
        },

        /**
         * Deletes all records from primary tables ({@link schema.administrators}, {@link schema.attachments},
         * {@link schema.sessions}, {@link schema.subjects}, {@link schema.students}, {@link schema.teachers},
         * and {@link schema.users}).
         *
         * While {@link schema.students}, {@link schema.teachers}, and {@link schema.users} are technically
         * secondary tables, they are considered primary in this context because they are directly referenced by many
         * other tables and are essential for the integrity of the database.
         *
         * **Because these are primary tables, all secondary tables that reference these tables will also
         * be affected.**
         */
        cleanupPrimaryTables: async () => {
            await db.transaction(async (tx) => {
                await tx.delete(schema.administrators);
                await tx.delete(schema.students);
                await tx.delete(schema.teachers);
                await tx.delete(schema.attachments);
                await tx.delete(schema.sessions);
                await tx.delete(schema.users);
                await tx.delete(schema.subjects);
            });
        },

        /**
         * Deletes all records from secondary tables ({@link schema.assignmentAttachments}, {@link schema.assignmentSubmissionAttachments},
         * {@link schema.materialAttachments}, {@link schema.assignmentSubmissions}, {@link schema.assignments},
         * {@link schema.materials}, {@link schema.notifications}, {@link schema.studentClasses}, {@link schema.schedules},
         * {@link schema.classSubjects}, and {@link schema.classes}).
         *
         * This will not affect primary tables. To clean up primary tables, use `cleanupPrimaryTables` instead.
         */
        cleanupSecondaryTables: async () => {
            await db.transaction(async (tx) => {
                await tx.delete(schema.assignmentAttachments);
                await tx.delete(schema.assignmentSubmissionAttachments);
                await tx.delete(schema.materialAttachments);
                await tx.delete(schema.assignmentSubmissions);
                await tx.delete(schema.assignments);
                await tx.delete(schema.materials);
                await tx.delete(schema.notifications);
                await tx.delete(schema.studentClasses);
                await tx.delete(schema.schedules);
                await tx.delete(schema.classSubjects);
                await tx.delete(schema.classes);
            });
        },

        /**
         * Deletes all records from all tables in the database. This is a combination of `cleanupPrimaryTables` and
         * `cleanupSecondaryTables`.
         */
        cleanupAllTables: async () => {
            await db.transaction(async (tx) => {
                // Secondary tables
                await tx.delete(schema.assignmentAttachments);
                await tx.delete(schema.assignmentSubmissionAttachments);
                await tx.delete(schema.materialAttachments);
                await tx.delete(schema.assignmentSubmissions);
                await tx.delete(schema.assignments);
                await tx.delete(schema.materials);
                await tx.delete(schema.notifications);
                await tx.delete(schema.studentClasses);
                await tx.delete(schema.schedules);
                await tx.delete(schema.classSubjects);
                await tx.delete(schema.classes);

                // Primary tables
                await tx.delete(schema.administrators);
                await tx.delete(schema.students);
                await tx.delete(schema.teachers);
                await tx.delete(schema.attachments);
                await tx.delete(schema.sessions);
                await tx.delete(schema.users);
                await tx.delete(schema.subjects);
            });
        },

        /**
         * Seeders for individual tables in the database.
         */
        seeders: {
            /**
             * Seeder for {@link schema.administrators} table.
             */
            administrators: createSeeder(schema.administrators),

            /**
             * Seeder for {@link schema.assignmentAttachments} table.
             */
            assignmentAttachments: createSeeder(schema.assignmentAttachments),

            /**
             * Seeder for {@link schema.assignments} table.
             */
            assignments: createSeeder(schema.assignments),

            /**
             * Seeder for {@link schema.assignmentSubmissionAttachments} table.
             */

            assignmentSubmissionAttachments: createSeeder(
                schema.assignmentSubmissionAttachments,
            ),

            /**
             * Seeder for {@link schema.assignmentSubmissions} table.
             */
            assignmentSubmissions: createSeeder(schema.assignmentSubmissions),

            /**
             * Seeder for {@link schema.attachments} table.
             */
            attachments: createSeeder(schema.attachments),

            /**
             * Seeder for {@link schema.classes} table.
             */
            classes: createSeeder(schema.classes),

            /**
             * Seeder for {@link schema.classSubjects} table.
             */
            classSubjects: createSeeder(schema.classSubjects),

            /**
             * Seeder for {@link schema.materialAttachments} table.
             */
            materialAttachments: createSeeder(schema.materialAttachments),

            /**
             * Seeder for {@link schema.materials} table.
             */
            materials: createSeeder(schema.materials),

            /**
             * Seeder for {@link schema.notifications} table.
             */
            notifications: createSeeder(schema.notifications),

            /**
             * Seeder for {@link schema.schedules} table.
             */
            schedules: createSeeder(schema.schedules),

            /**
             * Seeder for {@link schema.sessions} table.
             */
            sessions: createSeeder(schema.sessions),

            /**
             * Seeder for {@link schema.studentClasses} table.
             */
            studentClasses: createSeeder(schema.studentClasses),

            /**
             * Seeder for {@link schema.students} table.
             */
            students: createSeeder(schema.students),

            /**
             * Seeder for {@link schema.subjects} table.
             */
            subjects: createSeeder(schema.subjects),

            /**
             * Seeder for {@link schema.teachers} table.
             */
            teachers: createSeeder(schema.teachers),

            /**
             * Seeder for {@link schema.users} table.
             */
            users: createSeeder(schema.users),
        },
    } as const;
}

//#endregion
