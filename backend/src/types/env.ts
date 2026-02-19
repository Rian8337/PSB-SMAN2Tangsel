/**
 * Environment variable keys used in the application.
 */
export enum EnvironmentVariableKey {
    /**
     * The secret key used for signing cookies.
     */
    cookieSecret = "COOKIE_SECRET",

    /**
     * The name of the database to connect to.
     */
    databaseName = "DB_NAME",

    /**
     * The host address of the database server.
     */
    databaseHost = "DB_HOST",

    /**
     * The password for authenticating with the database server.
     */
    databasePassword = "DB_PASSWORD",

    /**
     * The port number on which the database server is listening.
     */
    databasePort = "DB_PORT",

    /**
     * The username for authenticating with the database server.
     */
    databaseUser = "DB_USER",

    /**
     * The environment mode the application is running in.
     *
     * Values can be `development`, `production`, or `test`.
     */
    nodeEnv = "NODE_ENV",

    /**
     * The port number the server should listen on.
     */
    port = "PORT",

    /**
     * The key used to encrypt user sessions.
     */
    sessionEncryptionKey = "SESSION_ENCRYPTION_KEY",
}
