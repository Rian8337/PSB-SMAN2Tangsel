"use client";

import { useLocale } from "next-intl";
import { createContext, use, useMemo } from "react";
import { ApiProviderProps } from "./api-provider-props";
import { ISessionAPIClient, SessionAPIClient } from "@/api";

const ApiContext = createContext<ISessionAPIClient | null>(null);

/**
 * Provider for an {@link ISessionAPIClient}.
 */
export const SessionApiProvider = ({
    children,
    client,
}: ApiProviderProps<ISessionAPIClient>) => {
    const locale = useLocale();

    const activeClient = useMemo(
        () => client ?? new SessionAPIClient(locale),
        [client, locale],
    );

    return <ApiContext value={activeClient}>{children}</ApiContext>;
};

/**
 * Hook to access the {@link ISessionAPIClient} provided by the {@link SessionApiProvider}.
 */
export const useSessionApiClient = () => {
    const context = use(ApiContext);

    if (!context) {
        throw new Error(
            "useSessionApiClient must be used within a SessionApiProvider",
        );
    }

    return context;
};
