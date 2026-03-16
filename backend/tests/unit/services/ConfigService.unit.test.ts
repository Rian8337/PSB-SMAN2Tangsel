import { ConfigService } from "@/services";
import { EnvironmentVariableKey } from "@/types";

describe("ConfigService (unit)", () => {
    const service = new ConfigService();

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    describe("getEnvironmentVariable", () => {
        it("should return the value of an existing environment variable", () => {
            vi.stubEnv("TEST_ENV_VAR", "test_value");

            const result = service.getEnvironmentVariable(
                "TEST_ENV_VAR" as EnvironmentVariableKey,
            );

            expect(result).toBe("test_value");
        });

        it("should return undefined for a non-existing environment variable", () => {
            const result = service.getEnvironmentVariable(
                "NON_EXISTING_ENV_VAR" as EnvironmentVariableKey,
            );

            expect(result).toBeUndefined();
        });

        it("should throw an error if a required environment variable does not exist", () => {
            expect(() =>
                service.getEnvironmentVariable(
                    "NON_EXISTING_ENV_VAR" as EnvironmentVariableKey,
                    true,
                ),
            ).toThrow();
        });
    });
});
