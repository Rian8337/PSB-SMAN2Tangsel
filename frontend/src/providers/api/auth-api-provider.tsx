"use client";

import { AuthAPIClient, IAuthAPIClient } from "@/api";
import { useLocale } from "next-intl";
import { createContext, use, useMemo } from "react";
import { ApiProviderProps } from "./api-provider-props";

const ApiContext = createContext<IAuthAPIClient | null>(null);

/**
 * Provider for an {@link IAuthAPIClient}.
 */
export const AuthApiProvider = ({
    children,
    client,
}: ApiProviderProps<IAuthAPIClient>) => {
    const locale = useLocale();

    const activeClient = useMemo(
        () => client ?? new AuthAPIClient(locale),
        [client, locale],
    );

    return <ApiContext value={activeClient}>{children}</ApiContext>;
};

/**
 * Hook to access the {@link IAuthAPIClient} provided by the {@link AuthApiProvider}.
 */
export const useAuthApiClient = () => {
    const context = use(ApiContext);

    if (!context) {
        throw new Error(
            "useAuthApiClient must be used within an AuthApiProvider",
        );
    }

    return context;
};
