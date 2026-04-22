"use client";

import { APIError } from "@/api";
import { useDebounce } from "@/hooks";
import { useClassStudentApiClient } from "@/providers/api/class-student-api-provider";
import { Box, Button, Flex, Input, Spinner, Table } from "@chakra-ui/react";
import { Class, UserListItem } from "@psb/shared/types";
import { Search, Trash2, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "../layout/PageHeader";
import { Pagination } from "../ui/Pagination";
import { toaster } from "../ui/toaster";
import { AssignClassStudentModal } from "./AssignClassStudentModal";

export interface ClassStudentManagementProps {
    readonly clazz: Class;
}

export function ClassStudentManagement({ clazz }: ClassStudentManagementProps) {
    const t = useTranslations("ClassStudentManagement");
    const classStudentApiClient = useClassStudentApiClient();

    const [isLoading, setIsLoading] = useState(true);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [enrolledStudents, setEnrolledStudents] = useState<UserListItem[]>(
        [],
    );

    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const limit = 10;

    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearchQuery]);

    const fetchStudents = useCallback(
        async (query?: string, page = 1, signal?: AbortSignal) => {
            setIsLoading(true);

            try {
                const students =
                    await classStudentApiClient.getEnrolledStudents(
                        clazz.id,
                        query,
                        limit,
                        (page - 1) * limit,
                        signal,
                    );

                setEnrolledStudents(students);
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
        [clazz.id, classStudentApiClient, limit, t],
    );

    // Trigger fetch on mount, page change, search, or refresh
    useEffect(() => {
        // Prevent fetching if the user is currently typing
        if (searchQuery !== debouncedSearchQuery) {
            return;
        }

        const controller = new AbortController();

        void fetchStudents(debouncedSearchQuery, page, controller.signal);

        return () => {
            controller.abort();
        };
    }, [
        fetchStudents,
        searchQuery,
        debouncedSearchQuery,
        page,
        refreshTrigger,
    ]);

    const handleRemoveStudent = async (
        studentId: number,
        studentName: string,
    ) => {
        if (
            !confirm(
                t("remove.confirmation", {
                    student: studentName,
                    class: clazz.name,
                }),
            )
        ) {
            return;
        }

        try {
            await classStudentApiClient.unenrollStudent(clazz.id, studentId);

            toaster.create({
                title: t("remove.toast.successTitle"),
                description: t("remove.toast.successMessage", {
                    student: studentName,
                    class: clazz.name,
                }),
                type: "success",
            });

            setRefreshTrigger((prev) => prev + 1);
        } catch (e) {
            toaster.create({
                title: t("remove.toast.errorTitle"),
                description:
                    e instanceof APIError
                        ? e.message
                        : t("remove.toast.errorMessage"),
                type: "error",
            });
        }
    };

    return (
        <>
            <PageHeader
                title={t("title", { class: clazz.name })}
                backButtonUrl="/admin/classes"
            />

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
                            setIsAssignModalOpen(true);
                        }}
                    >
                        <UserPlus size={18} style={{ marginRight: "8px" }} />
                        {t("enrollNewStudent")}
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
                    {isLoading && enrolledStudents.length === 0 ? (
                        <Flex justify="center" align="center" h="200px">
                            <Spinner size="xl" />
                        </Flex>
                    ) : (
                        <Table.Root variant="line" minW="600px">
                            <Table.Header>
                                <Table.Row>
                                    <Table.ColumnHeader>
                                        {t("columns.identifier")}
                                    </Table.ColumnHeader>

                                    <Table.ColumnHeader>
                                        {t("columns.name")}
                                    </Table.ColumnHeader>

                                    <Table.ColumnHeader textAlign="right">
                                        {t("columns.actions")}
                                    </Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>

                            <Table.Body>
                                {enrolledStudents.length > 0 ? (
                                    enrolledStudents.map((student) => (
                                        <Table.Row key={student.id}>
                                            <Table.Cell fontWeight="medium">
                                                {student.identifier}
                                            </Table.Cell>

                                            <Table.Cell>
                                                {student.name}
                                            </Table.Cell>

                                            <Table.Cell textAlign="right">
                                                <Button
                                                    aria-label={`remove-student-${student.identifier}`}
                                                    size="sm"
                                                    variant="ghost"
                                                    colorPalette="red"
                                                    onClick={() => {
                                                        void handleRemoveStudent(
                                                            student.id,
                                                            student.name,
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
                                            colSpan={3}
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
                    hasMore={enrolledStudents.length >= limit}
                    isLoading={isLoading}
                    onPrevPage={() => {
                        setPage((p) => p - 1);
                    }}
                    onNextPage={() => {
                        setPage((p) => p + 1);
                    }}
                />

                {isAssignModalOpen && (
                    <AssignClassStudentModal
                        isOpen={isAssignModalOpen}
                        clazz={clazz}
                        onClose={() => {
                            setIsAssignModalOpen(false);
                        }}
                        onSuccess={() => {
                            // Reset to page 1 to see the new assignment.
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
