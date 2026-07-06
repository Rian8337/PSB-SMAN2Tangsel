import { decodeSessionCode } from "@psb/shared/utils";

describe("decodeSessionCode (unit)", () => {
    describe("valid inputs", () => {
        it("should decode a valid code with semester 1", () => {
            expect(decodeSessionCode("24251")).toEqual({
                session: "2024/2025",
                semester: 1,
            });
        });

        it("should decode a valid code with semester 2", () => {
            expect(decodeSessionCode("24252")).toEqual({
                session: "2024/2025",
                semester: 2,
            });
        });

        it("should decode a valid code with different years", () => {
            expect(decodeSessionCode("25261")).toEqual({
                session: "2025/2026",
                semester: 1,
            });
        });
    });

    describe("invalid format", () => {
        it("should return null for an empty string", () => {
            expect(decodeSessionCode("")).toBeNull();
        });

        it("should return null for a code shorter than 5 digits", () => {
            expect(decodeSessionCode("2425")).toBeNull();
        });

        it("should return null for a code longer than 5 digits", () => {
            expect(decodeSessionCode("242521")).toBeNull();
        });

        it("should return null for a code containing non-digit characters", () => {
            expect(decodeSessionCode("2425X")).toBeNull();
        });

        it("should return null for a code with a decimal point", () => {
            expect(decodeSessionCode("24.52")).toBeNull();
        });
    });

    describe("invalid schema values", () => {
        it("should return null when year2 is not exactly one after year1 (gap of 2)", () => {
            // "24262" --> 2024/2026
            expect(decodeSessionCode("24262")).toBeNull();
        });

        it("should return null when year1 and year2 are the same", () => {
            // "24242" --> 2024/2024
            expect(decodeSessionCode("24242")).toBeNull();
        });

        it("should return null when year2 is before year1", () => {
            // "25242" --> 2025/2024
            expect(decodeSessionCode("25242")).toBeNull();
        });

        it("should return null for semester 0", () => {
            expect(decodeSessionCode("24250")).toBeNull();
        });

        it("should return null for semester 3", () => {
            expect(decodeSessionCode("24253")).toBeNull();
        });

        it("should return null at the century boundary where years are not consecutive", () => {
            // "99001" --> 2099/2000; 2000 !== 2099 + 1
            expect(decodeSessionCode("99001")).toBeNull();
        });
    });
});
