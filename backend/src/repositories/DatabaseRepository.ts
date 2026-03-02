import { DrizzleDb } from "@psb/shared/types";

/**
 * Base class for repositories that interact with the database.
 */
export abstract class DatabaseRepository {
    constructor(
        /**
         * The database to use for queries.
         */
        protected readonly db: DrizzleDb,
    ) {}
}
