import { injectable, InjectionToken } from "tsyringe";
import { constructor } from "tsyringe/dist/typings/types";

/**
 * Marks a class to be injectable with the given token.
 *
 * Unlike tsyringe's {@link injectable}, providing a token does not immediately register it
 * to the container. Instead, it stores the token as metadata on the class, which can later
 * be used to register the class to a specific container.
 *
 * @param token The injection token representing the class.
 * @returns A class decorator.
 */
export function Injectable(token: InjectionToken): ClassDecorator {
    return (target) => {
        const targetConstructor = target as unknown as constructor<unknown>;

        Reflect.defineMetadata("registrationToken", token, target);

        const classes =
            (Reflect.getMetadata("classes", globalThis) as
                | constructor<unknown>[]
                | undefined) ?? [];

        Reflect.defineMetadata(
            "classes",
            classes.concat(targetConstructor),
            globalThis,
        );

        injectable()(targetConstructor);
    };
}
