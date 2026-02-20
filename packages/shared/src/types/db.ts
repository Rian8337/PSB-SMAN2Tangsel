import { MySql2Database } from "drizzle-orm/mysql2";
import * as schema from "../database/schema";

/**
 * The type of the Drizzle database.
 */
export type DrizzleDb = MySql2Database<typeof schema>;
