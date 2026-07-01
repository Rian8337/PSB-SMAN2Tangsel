"use client";

import { useDebounce } from "@/hooks";
import { useSubjectApiClient } from "@/providers/api/subject-api-provider";
import {
    Badge,
    Box,
    Button,
    Flex,
    Input,
    Spinner,
    Table,
} from "@chakra-ui/react";
import { Subject } from "@psb/shared/types";
import { Check, Plus, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState, useTransition } from "react";
import { PageHeader } from "../layout/PageHeader";
import { Pagination } from "../ui/Pagination";
import { toaster } from "../ui/toaster";
import { CreateSubjectModal } from "./CreateSubjectModal";
import { TableDeleteButton } from "./TableDeleteButton";
import { TableEditButton } from "./TableEditButton";

export function SubjectManagement() {
    const t = useTranslations("SubjectManagement");
    const subjectApiClient = useSubjectApiClient();

    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isPending, startTransition] = useTransition();
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const limit = 10;

    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const fetchSubjects = useCallback(
        async (query?: string, page = 1, signal?: AbortSignal) => {
            try {
                const data = await subjectApiClient.listSubjects(
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

        startTransition(() =>
            fetchSubjects(debouncedSearchQuery, page, controller.signal),
        );

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
        <>
            <PageHeader title={t("title")} backButtonUrl="/admin" showSessionSwitcher={false} />

            <Box
                p={{ base: 4, md: 8 }}
                w="full"
                h="full"
                display="flex"
                flexDirection="column"
            >
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
                                setPage(1);
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
                    {isPending ? (
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
                                                        aria-label={`active-badge-${subject.code}`}
                                                    >
                                                        <Check size={16} />
                                                    </Badge>
                                                )}
                                            </Table.Cell>

                                            <Table.Cell textAlign="right">
                                                <TableEditButton
                                                    href={`/admin/subjects/${subject.id.toString()}`}
                                                    ariaLabel={`edit-${subject.code}`}
                                                />

                                                <TableDeleteButton
                                                    ariaLabel={`delete-${subject.code}`}
                                                    onClick={() => {
                                                        handleDelete(
                                                            subject.id,
                                                            subject.code,
                                                        );
                                                    }}
                                                />
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
                    isLoading={isPending}
                    onPrevPage={() => {
                        setPage((p) => p - 1);
                    }}
                    onNextPage={() => {
                        setPage((p) => p + 1);
                    }}
                />

                {isCreateModalOpen && (
                    <CreateSubjectModal
                        isOpen={isCreateModalOpen}
                        onClose={() => {
                            setIsCreateModalOpen(false);
                        }}
                        onSuccess={() => {
                            setPage(1);
                            setSearchQuery("");
                            setRefreshTrigger((prev) => prev + 1);
                        }}
                    />
                )}
            </Box>
        </>
    );
}
