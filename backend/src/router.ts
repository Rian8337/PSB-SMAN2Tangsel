import { RequestHandler, Router } from "express";
// Ensure controllers are loaded and metadata is registered
import "./controllers";
import { RouteDefinition } from "./decorators/routes";
import { getContainer } from "./dependencies/container";

/**
 * Creates an Express router by scanning for controller classes and their route definitions.
 *
 * This function looks for classes decorated as controllers, retrieves their base paths and route definitions,
 * and registers them with the Express router. It also applies any controller-level and route-level middlewares
 * defined via decorators.
 *
 * @param container The dependency injection container to use for resolving controller instances. If not provided,
 * the default container will be used.
 * @returns The configured Express router with all controller routes registered.
 */
export function createRouter(container = getContainer()) {
    const router = Router();

    const controllers =
        (Reflect.getMetadata("controllers", globalThis) as
            | (new () => Record<string, RequestHandler>)[]
            | undefined) ?? [];

    for (const ControllerClass of controllers) {
        const basePath = Reflect.getMetadata("basePath", ControllerClass) as
            | string
            | undefined;

        if (!basePath) {
            throw new Error(
                `Controller ${ControllerClass.name} does not have a base path defined. It may not have been decorated with @Controller.`,
            );
        }

        const routes =
            (Reflect.getMetadata("routes", ControllerClass) as
                | RouteDefinition[]
                | undefined) ?? [];

        if (routes.length === 0) {
            // Skip controllers without routes
            continue;
        }

        const controllerMiddlewares =
            (Reflect.getMetadata("controller:middlewares", ControllerClass) as
                | RequestHandler[]
                | undefined) ?? [];

        if (!container.isRegistered(ControllerClass)) {
            container.registerSingleton(ControllerClass);
        }

        const instance = container.resolve(ControllerClass);

        for (const route of routes) {
            const routeMiddlewares =
                (Reflect.getMetadata(
                    "route:middlewares",
                    ControllerClass.prototype as object,
                    route.handlerName,
                ) as RequestHandler[] | undefined) ?? [];

            const fullPath = `${basePath}${route.path}`;

            router[route.method](
                fullPath,
                ...controllerMiddlewares,
                ...routeMiddlewares,
                instance[route.handlerName].bind(instance),
            );
        }
    }

    return router;
}
