"use client";

import {
    ISubjectAssignmentSubmissionAPIClient,
    SubjectAssignmentSubmissionAPIClient,
} from "@/api";
import { useLocale } from "next-intl";
import { createContext, use, useMemo } from "react";
import { ApiProviderProps } from "./api-provider-props";

const ApiContext =
    createContext<ISubjectAssignmentSubmissionAPIClient | null>(null);

/**
 * Provider for an {@link ISubjectAssignmentSubmissionAPIClient}.
 */
export const SubjectAssignmentSubmissionApiProvider = ({
    children,
    client,
}: ApiProviderProps<ISubjectAssignmentSubmissionAPIClient>) => {
    const locale = useLocale();

    const activeClient = useMemo(
        () => client ?? new SubjectAssignmentSubmissionAPIClient(locale),
        [client, locale],
    );

    return <ApiContext value={activeClient}>{children}</ApiContext>;
};

/**
 * Hook to access the {@link ISubjectAssignmentSubmissionAPIClient} provided by the
 * {@link SubjectAssignmentSubmissionApiProvider}.
 */
export const useSubjectAssignmentSubmissionApiClient = () => {
    const context = use(ApiContext);

    if (!context) {
        throw new Error(
            "useSubjectAssignmentSubmissionApiClient must be used within a SubjectAssignmentSubmissionApiProvider",
        );
    }

    return context;
};
