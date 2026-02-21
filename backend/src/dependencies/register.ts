import { createDatabase } from "@/database";
import { InjectionToken } from "tsyringe";
import { constructor } from "tsyringe/dist/typings/types";
// Ensure repositories and services are loaded and metadata is registered
import "../repositories";
import "../services";
import { getContainer } from "./container";
import { dependencyTokens } from "./tokens";

/**
 * Registers all repositories and services to a DI container.
 *
 * @param container The DI container to register the dependencies to.
 * If not provided, the container from {@link getContainer} will be used.
 */
export function registerDependencies(container = getContainer()) {
    const classes =
        (Reflect.getMetadata("classes", globalThis) as
            | constructor<unknown>[]
            | undefined) ?? [];

    for (const cls of classes) {
        const token = Reflect.getMetadata("registrationToken", cls) as
            | InjectionToken<unknown>
            | undefined;

        if (!token) {
            throw new Error(
                `Class ${cls.name} is missing a registration token. Please use the @Service or @Repository decorator.`,
            );
        }

        container.registerSingleton(token, cls);
    }

    // We only want to create and register the database instance once (otherwise we would create
    // multiple connection pools), so we check if it's already registered before creating it.
    if (!container.isRegistered(dependencyTokens.drizzleDb)) {
        container.registerInstance(
            dependencyTokens.drizzleDb,
            createDatabase(),
        );
    }
}
