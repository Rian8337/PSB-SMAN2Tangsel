interface Localization {
    readonly http: {
        readonly badRequest: string;
        readonly unauthorized: string;
        readonly forbidden: string;
        readonly notFound: string;
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
        readonly invalidQueryFormat: string;
        readonly invalidLimitFormat: string;
        readonly invalidLimitRange: string;
        readonly invalidOffsetFormat: string;
        readonly invalidOffsetRange: string;
    };

    readonly notificationController: {
        readonly invalidNotificationIdFormat: string;
        readonly invalidReadStatusFormat: string;
    };

    readonly scheduleController: {
        readonly baseIcsFilename: string;
    };

    readonly sessionService: {
        readonly noActiveSession: string;
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
        notificationController: {
            invalidNotificationIdFormat:
                "Parameter notificationId harus berupa bilangan bulat positif.",
            invalidReadStatusFormat:
                "Parameter read harus berupa boolean (true atau false).",
        },
        scheduleController: {
            baseIcsFilename: "jadwal_pelajaran",
        },
        sessionService: {
            noActiveSession: "Tidak ada tahun pelajaran yang aktif saat ini.",
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
            invalidQueryFormat: "Parameter query must be a string if provided.",
            invalidLimitFormat: "Parameter limit must be a positive integer.",
            invalidLimitRange: "Parameter limit must be within a valid range.",
            invalidOffsetFormat:
                "Parameter offset must be a non-negative integer.",
            invalidOffsetRange:
                "Parameter offset must be within a valid range.",
        },
        notificationController: {
            invalidNotificationIdFormat:
                "Parameter notificationId must be a positive integer.",
            invalidReadStatusFormat:
                "Parameter read must be a boolean (true or false).",
        },
        scheduleController: {
            baseIcsFilename: "class_schedule",
        },
        sessionService: {
            noActiveSession:
                "There is no active academic session at the moment.",
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
