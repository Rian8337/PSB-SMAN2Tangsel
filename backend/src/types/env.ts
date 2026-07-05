/**
 * Environment variable keys used in the application.
 */
export enum EnvironmentVariableKey {
    /**
     * The secret key used for signing cookies.
     */
    CookieSecret = "COOKIE_SECRET",

    /**
     * Comma-separated list of additional allowed CORS origins.
     */
    CorsOrigins = "CORS_ORIGINS",

    /**
     * The name of the database to connect to.
     */
    DatabaseName = "DB_NAME",

    /**
     * The host address of the database server.
     */
    DatabaseHost = "DB_HOST",

    /**
     * The password for authenticating with the database server.
     */
    DatabasePassword = "DB_PASSWORD",

    /**
     * The port number on which the database server is listening.
     */
    DatabasePort = "DB_PORT",

    /**
     * The username for authenticating with the database server.
     */
    DatabaseUser = "DB_USER",

    /**
     * The environment mode the application is running in.
     *
     * Values can be `development`, `production`, or `test`.
     */
    NodeEnv = "NODE_ENV",

    /**
     * The port number the server should listen on.
     */
    Port = "PORT",

    /**
     * The key used to encrypt user sessions.
     */
    SessionEncryptionKey = "SESSION_ENCRYPTION_KEY",

    /**
     * Whether the application is running in end-to-end test mode. This can be used to enable
     * test-specific behavior in the codebase.
     */
    IsE2ETest = "IS_E2E_TEST",

    /**
     * The root path of the file storage directory. Attachment files are resolved relative to this path.
     */
    StoragePath = "STORAGE_PATH",
}
