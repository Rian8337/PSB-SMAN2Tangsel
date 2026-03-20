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
        readonly inactiveUserAccount: string;
        readonly inactiveAdminAccount: string;
    };

    readonly notificationController: {
        readonly invalidLimitFormat: string;
        readonly invalidLimitRange: string;
        readonly invalidNotificationIdFormat: string;
        readonly invalidOffsetFormat: string;
        readonly invalidOffsetRange: string;
        readonly invalidReadStatusFormat: string;
    };

    readonly scheduleController: {
        readonly baseIcsFilename: string;
    };

    readonly sessionService: {
        readonly noActiveSession: string;
    };

    readonly userRepository: {
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
            inactiveUserAccount:
                "Akun Anda telah dinonaktifkan. Mohon hubungi administrator.",
            inactiveAdminAccount:
                "Akun administrator Anda telah dinonaktifkan. Mohon hubungi administrator lainnya.",
            sessionExpired: "Sesi Anda telah berakhir. Mohon masuk lagi.",
        },
        notificationController: {
            invalidLimitFormat:
                "Parameter limit harus berupa bilangan bulat positif.",
            invalidLimitRange:
                "Parameter limit harus berada dalam rentang yang valid.",
            invalidNotificationIdFormat:
                "Parameter notificationId harus berupa bilangan bulat positif.",
            invalidOffsetFormat:
                "Parameter offset harus berupa bilangan bulat non-negatif.",
            invalidOffsetRange:
                "Parameter offset harus berada dalam rentang yang valid.",
            invalidReadStatusFormat:
                "Parameter read harus berupa boolean (true atau false).",
        },
        scheduleController: {
            baseIcsFilename: "jadwal_pelajaran",
        },
        sessionService: {
            noActiveSession: "Tidak ada tahun pelajaran yang aktif saat ini.",
        },
        userRepository: {
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
            inactiveUserAccount:
                "Your account is inactive. Please contact an administrator.",
            inactiveAdminAccount:
                "Your administrator account is inactive. Please contact another administrator.",
            sessionExpired:
                "Your current session has expired. Please log in again.",
        },
        notificationController: {
            invalidLimitFormat: "Parameter limit must be a positive integer.",
            invalidLimitRange: "Parameter limit must be within a valid range.",
            invalidNotificationIdFormat:
                "Parameter notificationId must be a positive integer.",
            invalidOffsetFormat:
                "Parameter offset must be a non-negative integer.",
            invalidOffsetRange:
                "Parameter offset must be within a valid range.",
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
        userRepository: {
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
