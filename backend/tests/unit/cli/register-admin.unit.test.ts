import {
    validateIdentifier,
    validateName,
    validatePassword,
} from "@/cli/register-admin";

describe("register-admin (unit)", () => {
    describe("validateName", () => {
        it("should return false for an empty string", () => {
            expect(validateName("")).toBe(false);
        });

        it("should return false for a whitespace-only string", () => {
            expect(validateName("   ")).toBe(false);
        });

        it("should return false for a name exceeding 100 characters", () => {
            expect(validateName("A".repeat(101))).toBe(false);
        });

        it("should return false for a name containing digits", () => {
            expect(validateName("Admin123")).toBe(false);
        });

        it("should return false for a name containing symbols", () => {
            expect(validateName("Admin@Name")).toBe(false);
        });

        it("should return true for a valid name with letters only", () => {
            expect(validateName("Administrator")).toBe(true);
        });

        it("should return true for a valid name with letters and spaces", () => {
            expect(validateName("John Doe")).toBe(true);
        });

        it("should return true for a name at exactly 100 characters", () => {
            expect(validateName("A".repeat(100))).toBe(true);
        });
    });

    describe("validateIdentifier", () => {
        it("should return false for an empty string", () => {
            expect(validateIdentifier("")).toBe(false);
        });

        it('should return false for "0"', () => {
            expect(validateIdentifier("0")).toBe(false);
        });

        it("should return false for a non-numeric string", () => {
            expect(validateIdentifier("abc")).toBe(false);
        });

        it("should return false for a string starting with zero", () => {
            expect(validateIdentifier("012")).toBe(false);
        });

        it("should return false for a negative number string", () => {
            expect(validateIdentifier("-1")).toBe(false);
        });

        it("should return false for a decimal number string", () => {
            expect(validateIdentifier("1.5")).toBe(false);
        });

        it("should return true for a single positive digit", () => {
            expect(validateIdentifier("1")).toBe(true);
        });

        it("should return true for a multi-digit positive integer", () => {
            expect(validateIdentifier("12345")).toBe(true);
        });
    });

    describe("validatePassword", () => {
        it("should return false for a password shorter than 8 characters", () => {
            expect(validatePassword("Ab1@x")).toBe(false);
        });

        it("should return false for a password without an uppercase letter", () => {
            expect(validatePassword("password1@")).toBe(false);
        });

        it("should return false for a password without a lowercase letter", () => {
            expect(validatePassword("PASSWORD1@")).toBe(false);
        });

        it("should return false for a password without a digit", () => {
            expect(validatePassword("Password@!")).toBe(false);
        });

        it("should return false for a password without a special character", () => {
            expect(validatePassword("Password123")).toBe(false);
        });

        it("should return false for a password with an unsupported special character", () => {
            expect(validatePassword("Password1#")).toBe(false);
        });

        it("should return true for a valid password", () => {
            expect(validatePassword("Password1@")).toBe(true);
        });

        it("should return true for a valid password with all required character types", () => {
            expect(validatePassword("Abcdef1@")).toBe(true);
        });
    });
});
