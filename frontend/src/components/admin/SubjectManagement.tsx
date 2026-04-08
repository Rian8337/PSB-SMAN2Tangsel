"use client";

import { useDebounce } from "@/hooks";
import { Link } from "@/i18n/navigation";
import { useSubjectApiClient } from "@/providers/api/subject-api-provider";
import {
    Badge,
    Box,
    Button,
    Flex,
    Heading,
    HStack,
    Input,
    Spinner,
    Table,
    Text,
} from "@chakra-ui/react";
import { Subject } from "@psb/shared/types";
import { Check, Plus, Search, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toaster } from "../ui/toaster";
import { CreateSubjectModal } from "./CreateSubjectModal";

export function SubjectManagement() {
    const t = useTranslations("SubjectManagement");
    const subjectApiClient = useSubjectApiClient();

    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const limit = 10;

    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearchQuery]);

    const fetchSubjects = useCallback(
        async (query?: string, page = 1, signal?: AbortSignal) => {
            setIsLoading(true);

            try {
                const data = await subjectApiClient.listSubjects(
                    query,
                    limit,
                    (page - 1) * limit,
                    signal,
                );

                setSubjects(data);
            } catch {
                toaster.create({
                    title: t("fetchToast.errorTitle"),
                    description: t("fetchToast.errorMessage"),
                    type: "error",
                });
            } finally {
                setIsLoading(false);
            }
        },
        [subjectApiClient, t],
    );

    useEffect(() => {
        // Prevent fetching if user is still actively typing.
        if (searchQuery !== debouncedSearchQuery) {
            return;
        }

        const controller = new AbortController();

        void fetchSubjects(debouncedSearchQuery, page, controller.signal);

        return () => {
            controller.abort();
        };
    }, [
        fetchSubjects,
        searchQuery,
        debouncedSearchQuery,
        page,
        refreshTrigger,
    ]);

    const handleDelete = (id: number, code: string) => {
        if (!confirm(t("delete.confirmation", { code }))) {
            return;
        }

        subjectApiClient
            .deleteSubject(id)
            .then(() => {
                toaster.create({
                    title: t("delete.toast.successTitle"),
                    description: t("delete.toast.successMessage", { code }),
                    type: "success",
                });

                setRefreshTrigger((prev) => prev + 1);
            })
            .catch(() => {
                toaster.create({
                    title: t("delete.toast.errorTitle"),
                    description: t("delete.toast.errorMessage"),
                    type: "error",
                });
            });
    };

    return (
        <Box
            p={{ base: 4, md: 8 }}
            w="full"
            h="full"
            display="flex"
            flexDirection="column"
        >
            <Heading as="h2" size={{ base: "lg", md: "xl" }} mb={6}>
                {t("title")}
            </Heading>

            <Flex
                direction={{ base: "column", md: "row" }}
                justify="space-between"
                align={{ base: "stretch", md: "center" }}
                gap={4}
                mb={6}
            >
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
                        name="search"
                        pl={10}
                        placeholder={t("searchPlaceholder")}
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                        }}
                        bg="white"
                        borderRadius="md"
                    />
                </Box>

                <Button
                    w={{ base: "full", md: "auto" }}
                    colorPalette="blue"
                    bg="blue.600"
                    color="white"
                    _hover={{ bg: "blue.700" }}
                    onClick={() => {
                        setIsCreateModalOpen(true);
                    }}
                >
                    <Plus size={18} style={{ marginRight: "8px" }} />
                    {t("addButton")}
                </Button>
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

                                <Table.ColumnHeader textAlign="center">
                                    {t("columns.active")}
                                </Table.ColumnHeader>

                                <Table.ColumnHeader textAlign="right">
                                    {t("columns.actions")}
                                </Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>

                        <Table.Body>
                            {subjects.length > 0 ? (
                                subjects.map((subject) => (
                                    <Table.Row key={subject.id}>
                                        <Table.Cell fontWeight="medium">
                                            {subject.code}
                                        </Table.Cell>

                                        <Table.Cell color="gray.600">
                                            {subject.name}
                                        </Table.Cell>

                                        <Table.Cell textAlign="center">
                                            {subject.active && (
                                                <Badge
                                                    colorPalette="green"
                                                    variant="subtle"
                                                >
                                                    <Check size={16} />
                                                </Badge>
                                            )}
                                        </Table.Cell>

                                        <Table.Cell textAlign="right">
                                            <Button
                                                asChild
                                                variant="ghost"
                                                colorPalette="blue"
                                            >
                                                <Link
                                                    href={`/admin/subjects/edit?id=${subject.id.toString()}`}
                                                >
                                                    {t("actions.edit")}
                                                </Link>
                                            </Button>

                                            <Button
                                                aria-label={`delete-${subject.code}`}
                                                size="sm"
                                                variant="ghost"
                                                colorPalette="red"
                                                onClick={() => {
                                                    handleDelete(
                                                        subject.id,
                                                        subject.code,
                                                    );
                                                }}
                                            >
                                                <Trash2 size={16} />
                                            </Button>
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

            <Flex justify="space-between" align="center" mt={4}>
                <Text fontSize="sm" color="gray.500">
                    {t("pagination.info", { page: page.toString() })}
                </Text>

                <HStack gap={2}>
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={page === 1 || isLoading}
                        onClick={() => {
                            setPage((p) => p - 1);
                        }}
                    >
                        {t("pagination.previous")}
                    </Button>

                    <Button
                        size="sm"
                        variant="outline"
                        disabled={subjects.length < limit || isLoading}
                        onClick={() => {
                            setPage((p) => p + 1);
                        }}
                    >
                        {t("pagination.next")}
                    </Button>
                </HStack>
            </Flex>

            <CreateSubjectModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                }}
                onSuccess={() => {
                    setRefreshTrigger((prev) => prev + 1);
                }}
            />
        </Box>
    );
}
