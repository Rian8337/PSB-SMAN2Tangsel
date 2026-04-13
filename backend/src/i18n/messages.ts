interface Localization {
    readonly http: {
        readonly badRequest: string;
        readonly unauthorized: string;
        readonly forbidden: string;
        readonly notFound: string;
        readonly conflict: string;
        readonly serverError: string;
    };

    readonly auth: {
        readonly sessionExpired: string;
        readonly invalidCredentials: string;
        readonly invalidSession: string;
        readonly invalidStaffId: string;
        readonly tooManyAttempts: string;
    };

    readonly controller: {
        readonly invalidRoleFormat: string;
        readonly invalidQueryFormat: string;
        readonly invalidLimitFormat: string;
        readonly invalidLimitRange: string;
        readonly invalidOffsetFormat: string;
        readonly invalidOffsetRange: string;
    };

    readonly classController: {
        readonly invalidId: string;
    };

    readonly classService: {
        readonly classNotFound: string;
        readonly classInUse: string;
    };

    readonly classSubjectController: {
        readonly invalidAssignmentId: string;
    };

    readonly classSubjectService: {
        readonly classHasContent: string;
    };

    readonly notificationController: {
        readonly invalidNotificationIdFormat: string;
        readonly invalidReadStatusFormat: string;
    };

    readonly notificationService: {
        readonly notificationNotFound: string;
        readonly unauthorizedReadStatusUpdate: string;
    };

    readonly scheduleController: {
        readonly baseIcsFilename: string;
    };

    readonly scheduleService: {
        readonly scheduleNotFound: string;
        readonly invalidTimeOrder: string;
        readonly scheduleConflict: string;
    };

    readonly sessionService: {
        readonly duplicateSession: string;
        readonly noActiveSession: string;
        readonly sessionNotFound: string;
        readonly invalidSessionTime: string;
    };

    readonly subjectController: {
        readonly invalidSubjectId: string;
    };

    readonly subjectService: {
        readonly cannotDeleteSubjectWithClasses: string;
        readonly duplicateCode: string;
        readonly subjectNotFound: string;
    };

    readonly userController: {
        readonly invalidUserId: string;
    };

    readonly userService: {
        readonly invalidUsername: string;
        readonly duplicatePassword: string;
        readonly invalidCurrentPassword: string;
        readonly invalidPassword: string;
        readonly invalidIdentifier: string;
        readonly invalidRole: string;
        readonly userNotFound: string;
    };
}

/**
 * Messages for API responses.
 */
export const messages = {
    id: {
        http: {
            badRequest: "Bad Request",
            unauthorized: "Unauthorized",
            forbidden: "Forbidden",
            notFound: "Not Found",
            conflict: "Conflict",
            serverError: "Internal Server Error",
        },
        auth: {
            invalidCredentials: "Kredensial tidak valid.",
            invalidSession: "Sesi tidak valid.",
            invalidStaffId: "ID staf tidak valid.",
            sessionExpired: "Sesi Anda telah berakhir. Mohon masuk lagi.",
            tooManyAttempts:
                "Terlalu banyak percobaan masuk. Mohon coba lagi nanti.",
        },
        controller: {
            invalidRoleFormat:
                "Parameter role harus berupa peran pengguna yang valid.",
            invalidQueryFormat:
                "Parameter query harus berupa string jika disertakan.",
            invalidLimitFormat:
                "Parameter limit harus berupa bilangan bulat positif.",
            invalidLimitRange:
                "Parameter limit harus berada dalam rentang yang valid.",
            invalidOffsetFormat:
                "Parameter offset harus berupa bilangan bulat non-negatif.",
            invalidOffsetRange:
                "Parameter offset harus berada dalam rentang yang valid.",
        },
        classController: {
            invalidId: "Parameter id harus berupa bilangan bulat positif.",
        },
        classService: {
            classNotFound: "Kelas tidak ditemukan.",
            classInUse:
                "Kelas yang memiliki mata pelajaran atau siswa tidak dapat dihapus.",
        },
        classSubjectController: {
            invalidAssignmentId:
                "Parameter assignmentId harus berupa bilangan bulat positif.",
        },
        classSubjectService: {
            classHasContent:
                "Tidak dapat menghapus mata pelajaran ini karena sudah memiliki materi ajar atau tugas siswa.",
        },
        notificationController: {
            invalidNotificationIdFormat:
                "Parameter notificationId harus berupa bilangan bulat positif.",
            invalidReadStatusFormat:
                "Parameter read harus berupa boolean (true atau false).",
        },
        notificationService: {
            notificationNotFound: "Notifikasi tidak ditemukan.",
            unauthorizedReadStatusUpdate:
                "Anda tidak diizinkan untuk memperbarui status baca notifikasi ini.",
        },
        scheduleController: {
            baseIcsFilename: "jadwal_pelajaran",
        },
        scheduleService: {
            scheduleNotFound: "Jadwal tidak ditemukan.",
            invalidTimeOrder:
                "Waktu mulai harus lebih awal daripada waktu selesai.",
            scheduleConflict:
                "Jadwal yang diusulkan bertabrakan dengan jadwal yang sudah ada untuk kelas atau guru yang bersangkutan.",
        },
        sessionService: {
            duplicateSession:
                "Tahun pelajaran dengan sesi dan semester yang sama sudah ada.",
            noActiveSession: "Tidak ada tahun pelajaran yang aktif saat ini.",
            sessionNotFound: "Tahun pelajaran tidak ditemukan.",
            invalidSessionTime: "Waktu tahun pelajaran tidak valid.",
        },
        subjectController: {
            invalidSubjectId:
                "Parameter subjectId harus berupa bilangan bulat positif.",
        },
        subjectService: {
            cannotDeleteSubjectWithClasses:
                "Mata pelajaran yang memiliki kelas tidak dapat dihapus.",
            duplicateCode: "Kode mata pelajaran sudah ada.",
            subjectNotFound: "Mata pelajaran tidak ditemukan.",
        },
        userController: {
            invalidUserId:
                "Parameter userId harus berupa bilangan bulat positif.",
        },
        userService: {
            invalidIdentifier: "Identifikasi tidak valid.",
            duplicatePassword:
                "Kata sandi baru tidak boleh sama dengan kata sandi lama.",
            invalidCurrentPassword: "Kata sandi saat ini tidak valid.",
            invalidPassword:
                "Kata sandi tidak valid. Kata sandi harus terdiri dari minimal 8 karakter, dengan setidaknya 1 huruf kapital, 1 huruf kecil, 1 angka, dan 1 simbol.",
            invalidUsername:
                "Nama pengguna tidak valid. Nama pengguna harus terdiri dari 1-100 karakter.",
            invalidRole: "Peran pengguna tidak valid.",
            userNotFound: "Pengguna tidak ditemukan.",
        },
    },
    en: {
        http: {
            badRequest: "Bad Request",
            unauthorized: "Unauthorized",
            forbidden: "Forbidden",
            notFound: "Not Found",
            conflict: "Conflict",
            serverError: "Internal Server Error",
        },
        auth: {
            invalidCredentials: "Invalid credentials.",
            invalidSession: "Invalid session.",
            invalidStaffId: "Invalid staff ID.",
            sessionExpired:
                "Your current session has expired. Please log in again.",
            tooManyAttempts: "Too many login attempts. Please try again later.",
        },
        controller: {
            invalidRoleFormat: "Parameter role must be a valid user role.",
            invalidQueryFormat: "Parameter query must be a string if provided.",
            invalidLimitFormat: "Parameter limit must be a positive integer.",
            invalidLimitRange: "Parameter limit must be within a valid range.",
            invalidOffsetFormat:
                "Parameter offset must be a non-negative integer.",
            invalidOffsetRange:
                "Parameter offset must be within a valid range.",
        },
        classController: {
            invalidId: "Parameter id must be a positive integer.",
        },
        classService: {
            classNotFound: "Class not found.",
            classInUse:
                "Classes with associated subjects or students cannot be deleted.",
        },
        classSubjectController: {
            invalidAssignmentId:
                "Parameter assignmentId must be a positive integer.",
        },
        classSubjectService: {
            classHasContent:
                "Cannot unassign this subject. It already has teaching materials or student assignments associated with it.",
        },
        notificationController: {
            invalidNotificationIdFormat:
                "Parameter notificationId must be a positive integer.",
            invalidReadStatusFormat:
                "Parameter read must be a boolean (true or false).",
        },
        notificationService: {
            notificationNotFound: "Notification not found.",
            unauthorizedReadStatusUpdate:
                "You are not authorized to update the read status of this notification.",
        },
        scheduleController: {
            baseIcsFilename: "class_schedule",
        },
        scheduleService: {
            scheduleNotFound: "Schedule not found.",
            invalidTimeOrder: "Start time must be before end time.",
            scheduleConflict:
                "The proposed schedule conflicts with an existing schedule for the associated class or teacher.",
        },
        sessionService: {
            duplicateSession:
                "An academic session with the same session and semester already exists.",
            noActiveSession:
                "There is no active academic session at the moment.",
            sessionNotFound: "Academic session not found.",
            invalidSessionTime: "Invalid academic session time.",
        },
        subjectController: {
            invalidSubjectId: "Parameter subjectId must be a positive integer.",
        },
        subjectService: {
            cannotDeleteSubjectWithClasses:
                "Subject with associated classes cannot be deleted.",
            duplicateCode: "Subject code already exists.",
            subjectNotFound: "Subject not found.",
        },
        userController: {
            invalidUserId: "Parameter userId must be a positive integer.",
        },
        userService: {
            invalidIdentifier: "Invalid identifier.",
            duplicatePassword:
                "New password must be different from the old password.",
            invalidCurrentPassword: "Invalid current password.",
            invalidPassword:
                "Invalid password. Password must be at least 8 characters long with at least 1 capital letter, 1 lowercase letter, 1 number, and 1 symbol.",
            invalidUsername:
                "Invalid username. Username must be between 1 and 100 characters long.",
            invalidRole: "Invalid user role.",
            userNotFound: "User not found.",
        },
    },
} as const satisfies Record<string, Localization>;

/**
 * Available locales.
 */
export type Locale = keyof typeof messages;

/**
 * Recursively extracts nested keys and joins them with a dot.
 * Example: "http.notFound" | "auth.invalidCredentials"
 */
type NestedKeyOf<TObject extends object> = {
    [Key in keyof TObject & (string | number)]: TObject[Key] extends object
        ? `${Key}.${NestedKeyOf<TObject[Key]>}`
        : `${Key}`;
}[keyof TObject & (string | number)];

/**
 * Keys to retrieve messages.
 */
export type MessageKey = NestedKeyOf<Localization>;
