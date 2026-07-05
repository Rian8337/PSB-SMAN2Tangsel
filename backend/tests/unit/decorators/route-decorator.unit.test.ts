import {
    Delete,
    Get,
    HttpMethod,
    Patch,
    Post,
    Put,
    RouteDefinition,
} from "@/decorators/routes";
import { createMockMethodDecoratorTestTarget } from "@test/mocks";

describe("Route decorators (unit)", () => {
    const path = "/test";

    it.each([
        { decorator: Get, expectedMethod: HttpMethod.Get, path },
        { decorator: Post, expectedMethod: HttpMethod.Post, path },
        { decorator: Put, expectedMethod: HttpMethod.Put, path },
        { decorator: Patch, expectedMethod: HttpMethod.Patch, path },
        { decorator: Delete, expectedMethod: HttpMethod.Delete, path },
    ])(
        "Registers the route with the correct metadata for $expectedMethod",
        ({ decorator, expectedMethod, path }) => {
            const t = createMockMethodDecoratorTestTarget(decorator, path);

            const routes = Reflect.getMetadata(
                "routes",
                t.prototype.constructor,
            ) as RouteDefinition[];

            expect(routes).toBeDefined();
            expect(Array.isArray(routes)).toBe(true);
            expect(routes.length).toBe(1);

            const route = routes[0];

            expect(route.path).toBe(path);
            expect(route.method).toBe(expectedMethod);
            expect(route.handlerName).toBe(t.methodName);
        },
    );
});
