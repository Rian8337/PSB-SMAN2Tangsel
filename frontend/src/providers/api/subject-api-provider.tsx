"use client";

import { useLocale } from "next-intl";
import { createContext, use, useMemo } from "react";
import { ApiProviderProps } from "./api-provider-props";
import { ISubjectAPIClient, SubjectAPIClient } from "@/api";

const ApiContext = createContext<ISubjectAPIClient | null>(null);

/**
 * Provider for an {@link ISubjectAPIClient}.
 */
export const SubjectApiProvider = ({
    children,
    client,
}: ApiProviderProps<ISubjectAPIClient>) => {
    const locale = useLocale();

    const activeClient = useMemo(
        () => client ?? new SubjectAPIClient(locale),
        [client, locale],
    );

    return <ApiContext value={activeClient}>{children}</ApiContext>;
};

/**
 * Hook to access the {@link ISubjectAPIClient} provided by the {@link SubjectApiProvider}.
 */
export const useSubjectApiClient = () => {
    const context = use(ApiContext);

    if (!context) {
        throw new Error(
            "useSubjectApiClient must be used within a SubjectApiProvider",
        );
    }

    return context;
};
