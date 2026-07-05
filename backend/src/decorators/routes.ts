/**
 * Available HTTP methods for route definitions.
 */
export enum HttpMethod {
    Get = "get",
    Post = "post",
    Put = "put",
    Patch = "patch",
    Delete = "delete",
}

/**
 * Represents a route definition.
 */
export interface RouteDefinition {
    /**
     * The path of the route.
     */
    readonly path: string;

    /**
     * The HTTP method of the route.
     */
    readonly method: HttpMethod;

    /**
     * The name of the handler method.
     */
    readonly handlerName: string;
}

function createRouteDecorator(method: HttpMethod) {
    return (path: string): MethodDecorator => {
        return (target, propertyKey) => {
            const routes: RouteDefinition[] =
                (Reflect.getMetadata("routes", target.constructor) as
                    RouteDefinition[] | undefined) ?? [];

            routes.push({
                path,
                method,
                handlerName: propertyKey.toString(),
            });

            Reflect.defineMetadata("routes", routes, target.constructor);
        };
    };
}

/**
 * Marks a method as a route handler for a GET request.
 *
 * @param path The path of the route.
 * @returns A method decorator that registers the route.
 */
export const Get = createRouteDecorator(HttpMethod.Get);

/**
 * Marks a method as a route handler for a POST request.
 *
 * @param path The path of the route.
 * @returns A method decorator that registers the route.
 */
export const Post = createRouteDecorator(HttpMethod.Post);

/**
 * Marks a method as a route handler for a PUT request.
 *
 * @param path The path of the route.
 * @returns A method decorator that registers the route.
 */
export const Put = createRouteDecorator(HttpMethod.Put);

/**
 * Marks a method as a route handler for a PATCH request.
 *
 * @param path The path of the route.
 * @return A method decorator that registers the route.
 */
export const Patch = createRouteDecorator(HttpMethod.Patch);

/**
 * Marks a method as a route handler for a DELETE request.
 *
 * @param path The path of the route.
 * @return A method decorator that registers the route.
 */
export const Delete = createRouteDecorator(HttpMethod.Delete);
