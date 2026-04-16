"use client";

import { useLocale } from "next-intl";
import { createContext, use, useMemo } from "react";
import { ApiProviderProps } from "./api-provider-props";
import { ClassStudentAPIClient, IClassStudentAPIClient } from "@/api";

const ApiContext = createContext<IClassStudentAPIClient | null>(null);

/**
 * Provider for an {@link IClassStudentAPIClient}.
 */
export const ClassStudentApiProvider = ({
    children,
    client,
}: ApiProviderProps<IClassStudentAPIClient>) => {
    const locale = useLocale();

    const activeClient = useMemo(
        () => client ?? new ClassStudentAPIClient(locale),
        [client, locale],
    );

    return <ApiContext value={activeClient}>{children}</ApiContext>;
};

/**
 * Hook to access the {@link IClassStudentAPIClient} provided by the {@link ClassStudentApiProvider}.
 */
export const useClassStudentApiClient = () => {
    const context = use(ApiContext);

    if (!context) {
        throw new Error(
            "useClassStudentApiClient must be used within a ClassStudentApiProvider",
        );
    }

    return context;
};
