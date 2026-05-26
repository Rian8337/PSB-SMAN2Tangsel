"use client";

import {
    ISubjectAssignmentAPIClient,
    SubjectAssignmentAPIClient,
} from "@/api";
import { useLocale } from "next-intl";
import { createContext, use, useMemo } from "react";
import { ApiProviderProps } from "./api-provider-props";

const ApiContext = createContext<ISubjectAssignmentAPIClient | null>(null);

/**
 * Provider for an {@link ISubjectAssignmentAPIClient}.
 */
export const SubjectAssignmentApiProvider = ({
    children,
    client,
}: ApiProviderProps<ISubjectAssignmentAPIClient>) => {
    const locale = useLocale();

    const activeClient = useMemo(
        () => client ?? new SubjectAssignmentAPIClient(locale),
        [client, locale],
    );

    return <ApiContext value={activeClient}>{children}</ApiContext>;
};

/**
 * Hook to access the {@link ISubjectAssignmentAPIClient} provided by the
 * {@link SubjectAssignmentApiProvider}.
 */
export const useSubjectAssignmentApiClient = () => {
    const context = use(ApiContext);

    if (!context) {
        throw new Error(
            "useSubjectAssignmentApiClient must be used within a SubjectAssignmentApiProvider",
        );
    }

    return context;
};
