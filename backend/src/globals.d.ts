import type { Locale, MessageKey } from "./i18n";
import type { SessionData } from "./types";

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            /**
             * The environment mode the application is running in.
             */
            readonly NODE_ENV?: "development" | "production" | "test";

            /**
             * The host address of the database server.
             */
            readonly DB_HOST?: string;

            /**
             * The port number on which the database server is listening.
             */
            readonly DB_PORT?: string;

            /**
             * The username for authenticating with the database server.
             */
            readonly DB_USER?: string;

            /**
             * The password for authenticating with the database server.
             */
            readonly DB_PASSWORD?: string;

            /**
             * The name of the database to connect to on the database server.
             */
            readonly DB_NAME?: string;

            /**
             * The secret key used for signing cookies.
             */
            readonly COOKIE_SECRET?: string;

            /**
             * The key used to encrypt user sessions.
             */
            readonly SESSION_ENCRYPTION_KEY?: string;
        }
    }

    namespace Express {
        interface Request {
            /**
             * The decrypted session data attached by the auth middleware.
             *
             * Only present on role-protected routes.
             */
            sessionData?: SessionData;

            /**
             * Obtains a message for a request. The returned message will
             * be translated according to the {@link locale} of the request.
             *
             * @param path The path to the key of the message.
             * @returns The localized message.
             */
            t: (path: MessageKey) => string;

            /**
             * The locale of the request.
             */
            locale: Locale;
        }
    }
}
