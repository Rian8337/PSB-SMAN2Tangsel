"use client";

import { useLocale } from "next-intl";
import { createContext, use, useMemo } from "react";
import { ApiProviderProps } from "./api-provider-props";
import { ClassAPIClient, IClassAPIClient } from "@/api";

const ApiContext = createContext<IClassAPIClient | null>(null);

/**
 * Provider for an {@link IClassAPIClient}.
 */
export const ClassApiProvider = ({
    children,
    client,
}: ApiProviderProps<IClassAPIClient>) => {
    const locale = useLocale();

    const activeClient = useMemo(
        () => client ?? new ClassAPIClient(locale),
        [client, locale],
    );

    return <ApiContext value={activeClient}>{children}</ApiContext>;
};

/**
 * Hook to access the {@link IClassAPIClient} provided by the {@link ClassApiProvider}.
 */
export const useClassApiClient = () => {
    const context = use(ApiContext);

    if (!context) {
        throw new Error(
            "useClassApiClient must be used within a ClassApiProvider",
        );
    }

    return context;
};
