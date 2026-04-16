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

    readonly class: {
        readonly invalidId: string;
    };

    readonly classService: {
        readonly classNotFound: string;
        readonly classInUse: string;
    };

    readonly classSubject: {
        readonly invalidId: string;
    };

    readonly classSubjectService: {
        readonly classHasContent: string;
    };

    readonly classStudentService: {
        readonly studentIsEnrolled: string;
    };

    readonly notification: {
        readonly invalidId: string;
    };

    readonly notificationController: {
        readonly invalidReadStatusFormat: string;
    };

    readonly notificationService: {
        readonly notificationNotFound: string;
        readonly unauthorizedReadStatusUpdate: string;
    };

    readonly scheduleController: {
        readonly baseIcsFilename: string;
        readonly invalidDay: string;
        readonly invalidStartTime: string;
        readonly invalidEndTime: string;
        readonly invalidScheduleId: string;
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

    readonly subject: {
        readonly invalidId: string;
    };

    readonly subjectService: {
        readonly cannotDeleteSubjectWithClasses: string;
        readonly duplicateCode: string;
        readonly subjectNotFound: string;
    };

    readonly user: {
        readonly invalidId: string;
        readonly invalidName: string;
        readonly invalidPassword: string;
        readonly invalidRole: string;
        readonly invalidIdentifier: string;
    };

    readonly userService: {
        readonly duplicatePassword: string;
        readonly invalidCurrentPassword: string;
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
        class: {
            invalidId: "ID kelas harus berupa bilangan bulat positif.",
        },
        classService: {
            classNotFound: "Kelas tidak ditemukan.",
            classInUse:
                "Kelas yang memiliki mata pelajaran atau siswa tidak dapat dihapus.",
        },
        classSubject: {
            invalidId:
                "ID mata pelajaran kelas harus berupa bilangan bulat positif.",
        },
        classSubjectService: {
            classHasContent:
                "Tidak dapat menghapus mata pelajaran ini karena sudah memiliki materi ajar atau tugas siswa.",
        },
        classStudentService: {
            studentIsEnrolled: "Siswa sudah terdaftar dalam kelas {className}.",
        },
        notification: {
            invalidId: "ID notifikasi harus berupa bilangan bulat positif.",
        },
        notificationController: {
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
            invalidDay: "Parameter day harus berupa hari yang valid.",
            invalidStartTime:
                "Parameter startTime harus berupa tanggal yang valid.",
            invalidEndTime:
                "Parameter endTime harus berupa tanggal yang valid.",
            invalidScheduleId:
                "Parameter id harus berupa bilangan bulat positif.",
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
        subject: {
            invalidId: "ID mata pelajaran harus berupa bilangan bulat positif.",
        },
        subjectService: {
            cannotDeleteSubjectWithClasses:
                "Mata pelajaran yang memiliki kelas tidak dapat dihapus.",
            duplicateCode: "Kode mata pelajaran sudah ada.",
            subjectNotFound: "Mata pelajaran tidak ditemukan.",
        },
        user: {
            invalidId: "ID pengguna harus berupa bilangan bulat positif.",
            invalidName:
                "Nama pengguna tidak valid. Nama pengguna harus terdiri dari 1-100 karakter.",
            invalidPassword:
                "Kata sandi tidak valid. Kata sandi harus terdiri dari minimal 8 karakter, dengan setidaknya 1 huruf kapital, 1 huruf kecil, 1 angka, dan 1 simbol.",
            invalidRole: "Peran pengguna tidak valid.",
            invalidIdentifier: "Identifikasi tidak valid.",
        },
        userService: {
            duplicatePassword:
                "Kata sandi baru tidak boleh sama dengan kata sandi lama.",
            invalidCurrentPassword: "Kata sandi saat ini tidak valid.",
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
        class: {
            invalidId: "Class ID must be a positive integer.",
        },
        classService: {
            classNotFound: "Class not found.",
            classInUse:
                "Classes with associated subjects or students cannot be deleted.",
        },
        classSubject: {
            invalidId: "classSubjectId must be a positive integer.",
        },
        classSubjectService: {
            classHasContent:
                "Cannot unassign this subject. It already has teaching materials or student assignments associated with it.",
        },
        classStudentService: {
            studentIsEnrolled: "Student is already enrolled in {className}.",
        },
        notification: {
            invalidId: "Notification ID must be a positive integer.",
        },
        notificationController: {
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
            invalidDay: "Parameter day must be a valid day.",
            invalidStartTime: "Parameter startTime must be a valid date.",
            invalidEndTime: "Parameter endTime must be a valid date.",
            invalidScheduleId: "Parameter id must be a positive integer.",
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
        subject: {
            invalidId: "Subject ID must be a positive integer.",
        },
        subjectService: {
            cannotDeleteSubjectWithClasses:
                "Subject with associated classes cannot be deleted.",
            duplicateCode: "Subject code already exists.",
            subjectNotFound: "Subject not found.",
        },
        user: {
            invalidId: "User ID must be a positive integer.",
            invalidName:
                "Invalid username. Username must be between 1 and 100 characters long.",
            invalidPassword:
                "Invalid password. Password must be at least 8 characters long with at least 1 capital letter, 1 lowercase letter, 1 number, and 1 symbol.",
            invalidRole: "Invalid user role.",
            invalidIdentifier: "Invalid identifier.",
        },
        userService: {
            duplicatePassword:
                "New password must be different from the old password.",
            invalidCurrentPassword: "Invalid current password.",
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
