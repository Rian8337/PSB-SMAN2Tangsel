import { Roles } from "@/decorators/roles";
import { useContainer } from "@/dependencies/container";
import { dependencyTokens } from "@/dependencies/tokens";
import { UserRole } from "@psb/shared/types";
import {
    createMockMethodDecoratorTestTarget,
    createMockRequestFactory,
    createMockResponse,
    mockAuthService,
} from "@test/mocks";
import { createTestContainer } from "@test/setup/container";
import { RequestHandler } from "express";

describe("@Roles", () => {
    beforeEach(() => {
        const container = createTestContainer((container) => {
            container.registerInstance(
                dependencyTokens.authService,
                mockAuthService,
            );
        });

        useContainer(container);
    });

    it("Adds middleware metadata", () => {
        const t = createMockMethodDecoratorTestTarget(Roles, UserRole.Student);

        const middlewares = Reflect.getMetadata(
            "route:middlewares",
            t.prototype,
            t.methodName,
        ) as RequestHandler[];

        expect(middlewares).toBeDefined();
        expect(Array.isArray(middlewares)).toBe(true);
        expect(middlewares.length).toBe(1);
    });

    it("Adds middleware that checks user role", async () => {
        mockAuthService.verifySession.mockReturnValueOnce((req, res, next) => {
            next();
        });

        const t = createMockMethodDecoratorTestTarget(Roles, UserRole.Student);

        const middlewares = Reflect.getMetadata(
            "route:middlewares",
            t.prototype,
            t.methodName,
        ) as RequestHandler[];

        expect(middlewares).toBeDefined();
        expect(middlewares.length).toBe(1);

        const middleware = middlewares[0];
        expect(middleware).toBeInstanceOf(Function);

        await middleware(
            createMockRequestFactory()(),
            createMockResponse(),
            vi.fn(),
        );

        expect(mockAuthService.verifySession).toHaveBeenCalledWith(
            UserRole.Student,
        );
    });
});
