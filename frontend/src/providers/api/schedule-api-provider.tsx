"use client";

import { IScheduleAPIClient, ScheduleAPIClient } from "@/api";
import { useLocale } from "next-intl";
import { createContext, use, useMemo } from "react";
import { ApiProviderProps } from "./api-provider-props";

const ApiContext = createContext<IScheduleAPIClient | null>(null);

/**
 * Provider for an {@link IScheduleAPIClient}.
 */
export const ScheduleApiProvider = ({
    children,
    client,
}: ApiProviderProps<IScheduleAPIClient>) => {
    const locale = useLocale();

    const activeClient = useMemo(
        () => client ?? new ScheduleAPIClient(locale),
        [client, locale],
    );

    return <ApiContext value={activeClient}>{children}</ApiContext>;
};

/**
 * Hook to access the {@link IScheduleAPIClient} provided by the {@link ScheduleApiProvider}.
 */
export const useScheduleApiClient = () => {
    const context = use(ApiContext);

    if (!context) {
        throw new Error(
            "useScheduleApiClient must be used within a ScheduleApiProvider",
        );
    }

    return context;
};
