import id from "../../messages/id.json";
import en from "../../messages/en.json";

/**
 * Recursively transforms a nested object into a shape where all leaf values are strings.
 *
 * This allows us to compare the structure of different message files without worrying about the actual values.
 */
type DeepShape<T> = {
    [K in keyof T]: T[K] extends Record<string, unknown>
        ? DeepShape<T[K]>
        : string;
};

type BaseShape = DeepShape<typeof id>;

// Validate that all message files have the same keys as the base language (Indonesian in this case).
en satisfies BaseShape;
