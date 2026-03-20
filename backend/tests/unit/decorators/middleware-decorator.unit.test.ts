import { Use } from "@/decorators/middleware";
import {
    createMockClassDecoratorTestTarget,
    createMockMethodDecoratorTestTarget,
} from "@test/mocks";

describe("@Use decorator (unit)", () => {
    const middlewareFunction = () => {
        // Empty middleware
    };

    it("Registers a controller-level middleware with the correct metadata", () => {
        const t = createMockClassDecoratorTestTarget(Use, middlewareFunction);

        const middlewares = Reflect.getMetadata(
            "controller:middlewares",
            t,
        ) as unknown[];

        expect(middlewares).toBeDefined();
        expect(Array.isArray(middlewares)).toBe(true);
        expect(middlewares.length).toBe(1);
        expect(middlewares[0]).toBe(middlewareFunction);
    });

    it("Registers a route-level middleware with the correct metadata", () => {
        const t = createMockMethodDecoratorTestTarget(Use, middlewareFunction);

        const middlewares = Reflect.getMetadata(
            "route:middlewares",
            t.prototype,
            t.methodName,
        ) as unknown[];

        expect(middlewares).toBeDefined();
        expect(Array.isArray(middlewares)).toBe(true);
        expect(middlewares.length).toBe(1);
        expect(middlewares[0]).toBe(middlewareFunction);
    });
});
