"use client";

import { INotificationAPIClient, NotificationAPIClient } from "@/api";
import { useLocale } from "next-intl";
import { createContext, use, useMemo } from "react";
import { ApiProviderProps } from "./api-provider-props";

const ApiContext = createContext<INotificationAPIClient | null>(null);

/**
 * Provider for an {@link INotificationAPIClient}.
 */
export const NotificationApiProvider = ({
    children,
    client,
}: ApiProviderProps<INotificationAPIClient>) => {
    const locale = useLocale();

    const activeClient = useMemo(
        () => client ?? new NotificationAPIClient(locale),
        [client, locale],
    );

    return <ApiContext value={activeClient}>{children}</ApiContext>;
};

/**
 * Hook to access the {@link INotificationAPIClient} provided by the {@link NotificationApiProvider}.
 */
export const useNotificationApiClient = () => {
    const context = use(ApiContext);

    if (!context) {
        throw new Error(
            "useNotificationApiClient must be used within a NotificationApiProvider",
        );
    }

    return context;
};
