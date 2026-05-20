"use client";

import { ISubjectDashboardAPIClient, SubjectDashboardAPIClient } from "@/api";
import { useLocale } from "next-intl";
import { createContext, use, useMemo } from "react";
import { ApiProviderProps } from "./api-provider-props";

const ApiContext = createContext<ISubjectDashboardAPIClient | null>(null);

/**
 * Provider for an {@link ISubjectDashboardAPIClient}.
 */
export const SubjectDashboardApiProvider = ({
    children,
    client,
}: ApiProviderProps<ISubjectDashboardAPIClient>) => {
    const locale = useLocale();

    const activeClient = useMemo(
        () => client ?? new SubjectDashboardAPIClient(locale),
        [client, locale],
    );

    return <ApiContext value={activeClient}>{children}</ApiContext>;
};

/**
 * Hook to access the {@link ISubjectDashboardAPIClient} provided by the {@link SubjectDashboardApiProvider}.
 */
export const useSubjectDashboardApiClient = () => {
    const context = use(ApiContext);

    if (!context) {
        throw new Error(
            "useSubjectDashboardApiClient must be used within a SubjectDashboardApiProvider",
        );
    }

    return context;
};
