"use client";

import { BookmarkAPIClient, IBookmarkAPIClient } from "@/api";
import { useLocale } from "next-intl";
import { createContext, use, useMemo } from "react";
import { ApiProviderProps } from "./api-provider-props";

const ApiContext = createContext<IBookmarkAPIClient | null>(null);

/**
 * Provider for an {@link IBookmarkAPIClient}.
 */
export const BookmarkApiProvider = ({
    children,
    client,
}: ApiProviderProps<IBookmarkAPIClient>) => {
    const locale = useLocale();

    const activeClient = useMemo(
        () => client ?? new BookmarkAPIClient(locale),
        [client, locale],
    );

    return <ApiContext value={activeClient}>{children}</ApiContext>;
};

/**
 * Hook to access the {@link IBookmarkAPIClient} provided by the {@link BookmarkApiProvider}.
 */
export const useBookmarkApiClient = () => {
    const context = use(ApiContext);

    if (!context) {
        throw new Error(
            "useBookmarkApiClient must be used within a BookmarkApiProvider",
        );
    }

    return context;
};
