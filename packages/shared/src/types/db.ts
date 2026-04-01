import { createDatabase } from "../database";

/**
 * The type of the Drizzle database.
 */
export type DrizzleDb = ReturnType<typeof createDatabase>;

/**
 * The type of a Drizzle transaction, which is the parameter of the callback function passed to `db.transaction()`.
 */
export type Transaction = Parameters<
    Parameters<DrizzleDb["transaction"]>[0]
>[0];
