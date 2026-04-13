/**
 * The Regex pattern for validating passwords.
 *
 * Passwords must be at least 8 characters long with 1 capital letter, 1 lowercase letter, 1 number, and 1 symbol.
 */
export const passwordRegex =
    /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}/;
