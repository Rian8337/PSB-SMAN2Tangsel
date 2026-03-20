import { Injectable } from "@/decorators/injectable";
import { createMockClassDecoratorTestTarget } from "@test/mocks";

describe("@Injectable decorator (unit)", () => {
    afterEach(() => {
        // Clear metadata after each test to avoid interference
        const services = Reflect.getMetadata(
            "classes",
            globalThis,
        ) as unknown[];

        services.pop();
    });

    it("Adds metadata and registers the service to globalThis", () => {
        const testToken = "testToken";

        const registeredClass = createMockClassDecoratorTestTarget(
            Injectable,
            testToken,
        );

        expect(Reflect.getMetadata("registrationToken", registeredClass)).toBe(
            testToken,
        );

        const services = Reflect.getMetadata(
            "classes",
            globalThis,
        ) as unknown[];

        expect(services).toBeDefined();
        expect(Array.isArray(services)).toBe(true);
        expect(services).toContain(registeredClass);
    });
});
