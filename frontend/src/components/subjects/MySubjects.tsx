"use client";

import { useDebounce } from "@/hooks";
import { useSubjectApiClient } from "@/providers/api/subject-api-provider";
import { Box, Flex, Input, Spinner, Table } from "@chakra-ui/react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "../layout/PageHeader";
import { Pagination } from "../ui/Pagination";
import { toaster } from "../ui/toaster";
import { ClassSubjectAssignment } from "@psb/shared/types";

export function MySubjects() {
    const t = useTranslations("Subjects");
    const subjectApiClient = useSubjectApiClient();
    const router = useRouter();

    const [subjects, setSubjects] = useState<ClassSubjectAssignment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const limit = 10;

    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const fetchSubjects = useCallback(
        async (query?: string, page = 1, signal?: AbortSignal) => {
            setIsLoading(true);

            try {
                const data = await subjectApiClient.getMySubjects(
                    query,
                    limit,
                    (page - 1) * limit,
                    signal,
                );

                setSubjects(data);
            } catch (e) {
                if (e instanceof Error && e.name === "AbortError") {
                    return;
                }

                toaster.create({
                    title: t("fetchToast.errorTitle"),
                    description: t("fetchToast.errorMessage"),
                    type: "error",
                });
            } finally {
                if (!signal?.aborted) {
                    setIsLoading(false);
                }
            }
        },
        [subjectApiClient, t],
    );

    useEffect(() => {
        if (searchQuery !== debouncedSearchQuery) {
            return;
        }

        const controller = new AbortController();

        void fetchSubjects(debouncedSearchQuery, page, controller.signal);

        return () => {
            controller.abort();
        };
    }, [fetchSubjects, searchQuery, debouncedSearchQuery, page]);

    return (
        <>
            <PageHeader title={t("title")} backButtonUrl="/dashboard" />

            <Box
                p={{ base: 4, md: 8 }}
                w="full"
                h="full"
                display="flex"
                flexDirection="column"
            >
                <Flex mb={6}>
                    <Box
                        position="relative"
                        maxW={{ base: "full", md: "400px" }}
                        w="full"
                    >
                        <Box
                            position="absolute"
                            left={3}
                            top="50%"
                            transform="translateY(-50%)"
                        >
                            <Search size={18} />
                        </Box>

                        <Input
                            pl={10}
                            placeholder={t("searchPlaceholder")}
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPage(1);
                            }}
                            bg="white"
                            borderRadius="md"
                        />
                    </Box>
                </Flex>

                <Box
                    bg="white"
                    borderRadius="md"
                    borderWidth="1px"
                    overflowX="auto"
                    flex={1}
                    w="full"
                >
                    {isLoading ? (
                        <Flex justify="center" align="center" h="200px">
                            <Spinner size="xl" />
                        </Flex>
                    ) : (
                        <Table.Root variant="line" minW="800px">
                            <Table.Header>
                                <Table.Row>
                                    <Table.ColumnHeader>
                                        {t("columns.code")}
                                    </Table.ColumnHeader>

                                    <Table.ColumnHeader>
                                        {t("columns.name")}
                                    </Table.ColumnHeader>

                                    <Table.ColumnHeader>
                                        {t("columns.class")}
                                    </Table.ColumnHeader>

                                    <Table.ColumnHeader>
                                        {t("columns.teacher")}
                                    </Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>

                            <Table.Body>
                                {subjects.length > 0 ? (
                                    subjects.map((item) => (
                                        <Table.Row
                                            key={item.id}
                                            cursor="pointer"
                                            _hover={{ bg: "gray.50" }}
                                            onClick={() => {
                                                router.push(
                                                    `/subjects/${item.id.toString()}`,
                                                );
                                            }}
                                        >
                                            <Table.Cell fontWeight="medium">
                                                {item.subject.code}
                                            </Table.Cell>

                                            <Table.Cell color="gray.600">
                                                {item.subject.name}
                                            </Table.Cell>

                                            <Table.Cell>
                                                {item.class.name}
                                            </Table.Cell>

                                            <Table.Cell>
                                                {item.teacher?.name ?? "-"}
                                            </Table.Cell>
                                        </Table.Row>
                                    ))
                                ) : (
                                    <Table.Row>
                                        <Table.Cell
                                            colSpan={4}
                                            textAlign="center"
                                            py={8}
                                            color="gray.500"
                                        >
                                            {t("emptyState")}
                                        </Table.Cell>
                                    </Table.Row>
                                )}
                            </Table.Body>
                        </Table.Root>
                    )}
                </Box>

                <Pagination
                    page={page}
                    hasMore={subjects.length >= limit}
                    isLoading={isLoading}
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
