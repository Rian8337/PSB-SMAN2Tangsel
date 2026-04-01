import { MySql2Database } from "drizzle-orm/mysql2";
import * as schema from "../database/schema";

/**
 * The type of the Drizzle database.
 */
export type DrizzleDb = MySql2Database<typeof schema>;

/**
 * The type of a Drizzle transaction, which is the parameter of the callback function passed to `db.transaction()`.
 */
export type Transaction = Parameters<
    Parameters<DrizzleDb["transaction"]>[0]
>[0];
