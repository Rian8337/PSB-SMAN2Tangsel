"use client";

import { ISubjectMaterialAPIClient, SubjectMaterialAPIClient } from "@/api";
import { useLocale } from "next-intl";
import { createContext, use, useMemo } from "react";
import { ApiProviderProps } from "./api-provider-props";

const ApiContext = createContext<ISubjectMaterialAPIClient | null>(null);

/**
 * Provider for an {@link ISubjectMaterialAPIClient}.
 */
export const SubjectMaterialApiProvider = ({
    children,
    client,
}: ApiProviderProps<ISubjectMaterialAPIClient>) => {
    const locale = useLocale();

    const activeClient = useMemo(
        () => client ?? new SubjectMaterialAPIClient(locale),
        [client, locale],
    );

    return <ApiContext value={activeClient}>{children}</ApiContext>;
};

/**
 * Hook to access the {@link ISubjectMaterialAPIClient} provided by the {@link SubjectMaterialApiProvider}.
 */
export const useSubjectMaterialApiClient = () => {
    const context = use(ApiContext);

    if (!context) {
        throw new Error(
            "useSubjectMaterialApiClient must be used within a SubjectMaterialApiProvider",
        );
    }

    return context;
};
