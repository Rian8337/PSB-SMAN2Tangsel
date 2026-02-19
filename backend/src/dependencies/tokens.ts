import { DrizzleDb } from "@/database";
import { IAuthService, IConfigService } from "@/services";
import { InjectionToken } from "tsyringe";

/**
 * Tokens for dependency injection.
 */
export const dependencyTokens = {
    /**
     * Injection token for a Drizzle database instance.
     */
    drizzleDb: Symbol.for("drizzleDb") as InjectionToken<DrizzleDb>,

    //#region Repositories

    //#endregion

    //#region Services

    /**
     * Injection token for an {@link IAuthService}.
     */
    authService: Symbol.for("authService") as InjectionToken<IAuthService>,

    /**
     * Injection token for an {@link IConfigService}.
     */
    configService: Symbol.for(
        "configService",
    ) as InjectionToken<IConfigService>,

    //#endregion
} as const;
