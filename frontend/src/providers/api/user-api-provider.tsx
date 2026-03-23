"use client";

import { useLocale } from "next-intl";
import { createContext, use, useMemo } from "react";
import { ApiProviderProps } from "./api-provider-props";
import { IUserAPIClient, UserAPIClient } from "@/api";

const ApiContext = createContext<IUserAPIClient | null>(null);

/**
 * Provider for an {@link IUserAPIClient}.
 */
export const UserApiProvider = ({
    children,
    client,
}: ApiProviderProps<IUserAPIClient>) => {
    const locale = useLocale();

    const activeClient = useMemo(
        () => client ?? new UserAPIClient(locale),
        [client, locale],
    );

    return <ApiContext value={activeClient}>{children}</ApiContext>;
};

/**
 * Hook to access the {@link IUserAPIClient} provided by the {@link UserApiProvider}.
 */
export const useUserApiClient = () => {
    const context = use(ApiContext);

    if (!context) {
        throw new Error(
            "useUserApiClient must be used within a UserApiProvider",
        );
    }

    return context;
};
