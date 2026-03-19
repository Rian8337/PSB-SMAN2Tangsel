interface Localization {
    readonly http: {
        readonly unauthorized: string;
        readonly forbidden: string;
        readonly notFound: string;
        readonly serverError: string;
    };

    readonly auth: {
        readonly sessionExpired: string;
        readonly invalidCredentials: string;
        readonly invalidStaffId: string;
        readonly inactiveUserAccount: string;
        readonly inactiveAdminAccount: string;
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
            unauthorized: "Unauthorized",
            forbidden: "Forbidden",
            notFound: "Not Found",
            serverError: "Internal server error",
        },
        auth: {
            invalidCredentials: "Kredensial tidak valid.",
            invalidStaffId: "ID staf tidak valid.",
            inactiveUserAccount:
                "Akun Anda telah dinonaktifkan. Mohon hubungi administrator.",
            inactiveAdminAccount:
                "Akun administrator Anda telah dinonaktifkan. Mohon hubungi administrator lainnya.",
            sessionExpired: "Sesi Anda telah berakhir. Mohon masuk lagi.",
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
            unauthorized: "Unauthorized",
            forbidden: "Forbidden",
            notFound: "Not Found",
            serverError: "Internal server error",
        },
        auth: {
            invalidCredentials: "Invalid credentials.",
            invalidStaffId: "Invalid staff ID.",
            inactiveUserAccount:
                "Your account is inactive. Please contact an administrator.",
            inactiveAdminAccount:
                "Your administrator account is inactive. Please contact another administrator.",
            sessionExpired:
                "Your current session has expired. Please log in again.",
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
