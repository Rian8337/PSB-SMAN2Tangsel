import { Transaction } from "@psb/shared/types";

/**
 * Defines operations involving database transactions.
 *
 * Can be used to reuse transactions across multiple repositories.
 */
export interface ITransactionManager {
    /**
     * Executes the given callback function within a database transaction.
     *
     * @param callback The callback function to execute within the transaction. The transaction object is passed as a parameter to the callback function.
     */
    execute<T>(callback: (tx: Transaction) => Promise<T>): Promise<T>;
}
