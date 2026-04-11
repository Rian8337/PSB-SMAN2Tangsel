"use client";

import { useLocale } from "next-intl";
import { createContext, use, useMemo } from "react";
import { ApiProviderProps } from "./api-provider-props";
import { ClassSubjectAPIClient, IClassSubjectAPIClient } from "@/api";

const ApiContext = createContext<IClassSubjectAPIClient | null>(null);

/**
 * Provider for an {@link IClassSubjectAPIClient}.
 */
export const ClassSubjectApiProvider = ({
    children,
    client,
}: ApiProviderProps<IClassSubjectAPIClient>) => {
    const locale = useLocale();

    const activeClient = useMemo(
        () => client ?? new ClassSubjectAPIClient(locale),
        [client, locale],
    );

    return <ApiContext value={activeClient}>{children}</ApiContext>;
};

/**
 * Hook to access the {@link IClassSubjectAPIClient} provided by the {@link ClassSubjectApiProvider}.
 */
export const useClassSubjectApiClient = () => {
    const context = use(ApiContext);

    if (!context) {
        throw new Error(
            "useClassSubjectApiClient must be used within a ClassSubjectApiProvider",
        );
    }

    return context;
};
