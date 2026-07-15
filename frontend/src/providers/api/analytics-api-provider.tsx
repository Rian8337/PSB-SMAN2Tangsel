"use client";

import { AnalyticsAPIClient, IAnalyticsAPIClient } from "@/api";
import { useLocale } from "next-intl";
import { createContext, use, useMemo } from "react";
import { ApiProviderProps } from "./api-provider-props";

const ApiContext = createContext<IAnalyticsAPIClient | null>(null);

/**
 * Provider for an {@link IAnalyticsAPIClient}.
 */
export const AnalyticsApiProvider = ({
    children,
    client,
}: ApiProviderProps<IAnalyticsAPIClient>) => {
    const locale = useLocale();

    const activeClient = useMemo(
        () => client ?? new AnalyticsAPIClient(locale),
        [client, locale],
    );

    return <ApiContext value={activeClient}>{children}</ApiContext>;
};

/**
 * Hook to access the {@link IAnalyticsAPIClient} provided by the {@link AnalyticsApiProvider}.
 */
export const useAnalyticsApiClient = () => {
    const context = use(ApiContext);

    if (!context) {
        throw new Error(
            "useAnalyticsApiClient must be used within an AnalyticsApiProvider",
        );
    }

    return context;
};
