"use client";

import { useSessionCode } from "@/hooks";
import { Link } from "@/i18n/navigation";
import { useBookmarkApiClient } from "@/providers/api/bookmark-api-provider";
import { Box, Flex, Separator, Spinner, Text } from "@chakra-ui/react";
import {
    BookmarkedMaterial,
    ValidSemester,
    ValidSession,
} from "@psb/shared/types";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState, useTransition } from "react";
import { PageHeader } from "../layout/PageHeader";
import { Pagination } from "../ui/Pagination";
import { toaster } from "../ui/toaster";

export interface BookmarksProps {
    readonly session: ValidSession;
    readonly semester: ValidSemester;
}

export function Bookmarks({ session, semester }: BookmarksProps) {
    const sessionCode = useSessionCode();
    const t = useTranslations("Bookmarks");
    const bookmarkApiClient = useBookmarkApiClient();

    const [bookmarks, setBookmarks] = useState<BookmarkedMaterial[]>([]);
    const [isPending, startTransition] = useTransition();
    const [page, setPage] = useState(1);
    const limit = 10;

    const fetchBookmarks = useCallback(
        async (page: number, signal?: AbortSignal) => {
            try {
                const data = await bookmarkApiClient.getMyBookmarks(
                    session,
                    semester,
                    limit,
                    (page - 1) * limit,
                    signal,
                );

                setBookmarks(data);
            } catch (e) {
                if (e instanceof Error && e.name === "AbortError") {
                    return;
                }

                toaster.create({
                    title: t("fetchToast.errorTitle"),
                    description: t("fetchToast.errorMessage"),
                    type: "error",
                });
            }
        },
        [bookmarkApiClient, session, semester, t],
    );

    useEffect(() => {
        const controller = new AbortController();

        startTransition(() => fetchBookmarks(page, controller.signal));

        return () => {
            controller.abort();
        };
    }, [fetchBookmarks, page]);

    return (
        <>
            <PageHeader
                title={t("title")}
                backButtonUrl={`/${sessionCode}/dashboard`}
            />

            <Box p={{ base: 4, md: 8 }} w="full" h="full">
                {isPending ? (
                    <Flex justify="center" align="center" h="200px">
                        <Spinner size="xl" />
                    </Flex>
                ) : bookmarks.length === 0 ? (
                    <Text color="gray.500">{t("emptyState")}</Text>
                ) : (
                    <Box>
                        {bookmarks.map((bookmark) => (
                            <Box key={bookmark.materialId}>
                                <Flex
                                    justify="space-between"
                                    align="flex-start"
                                    py={3}
                                >
                                    <Box flex={1} pr={4}>
                                        <Link
                                            href={`/${sessionCode}/subjects/${bookmark.classSubjectId.toString()}/materials/${bookmark.materialId.toString()}`}
                                        >
                                            <Text
                                                color="blue.500"
                                                fontWeight="medium"
                                                _hover={{
                                                    textDecoration: "underline",
                                                }}
                                            >
                                                {bookmark.title}
                                            </Text>
                                        </Link>

                                        <Text
                                            color="gray.600"
                                            fontSize="sm"
                                            mt={1}
                                        >
                                            {bookmark.subject.name} &middot;{" "}
                                            {bookmark.class.name}
                                        </Text>
                                    </Box>
                                </Flex>

                                <Separator />
                            </Box>
                        ))}
                    </Box>
                )}

                <Pagination
                    page={page}
                    hasMore={bookmarks.length >= limit}
                    isLoading={isPending}
                    onPrevPage={() => {
                        setPage((p) => p - 1);
                    }}
                    onNextPage={() => {
                        setPage((p) => p + 1);
                    }}
                />
            </Box>
        </>
    );
}
