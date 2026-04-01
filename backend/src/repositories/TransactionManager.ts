import { DrizzleDb, Transaction } from "@psb/shared/types";
import { ITransactionManager } from "./ITransactionManager";
import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { inject } from "tsyringe";

/**
 * Defines operations involving database transactions.
 *
 * Can be used to reuse transactions across multiple repositories.
 */
@Injectable(dependencyTokens.transactionManager)
export class TransactionManager implements ITransactionManager {
    constructor(
        @inject(dependencyTokens.db)
        private readonly db: DrizzleDb,
    ) {}

    execute<T>(callback: (tx: Transaction) => Promise<T>): Promise<T> {
        return this.db.transaction(callback);
    }
}
