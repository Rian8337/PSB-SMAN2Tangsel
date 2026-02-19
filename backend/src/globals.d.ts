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
