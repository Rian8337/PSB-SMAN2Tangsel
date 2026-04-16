"use client";

import { APIError } from "@/api";
import { useDebounce } from "@/hooks";
import { useClassSubjectApiClient } from "@/providers/api/class-subject-api-provider";
import { useUserApiClient } from "@/providers/api/user-api-provider";
import {
    Box,
    Button,
    Flex,
    Heading,
    Input,
    Spinner,
    Table,
} from "@chakra-ui/react";
import { Class, ClassSubjectAssignment, UserRole } from "@psb/shared/types";
import { Plus, Search, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { AsyncSelect } from "../ui/AsyncSelect";
import { Pagination } from "../ui/Pagination";
import { toaster } from "../ui/toaster";
import { AssignClassSubjectModal } from "./AssignClassSubjectModal";

export interface ClassSubjectManagementProps {
    readonly clazz: Class;
}

export function ClassSubjectManagement({ clazz }: ClassSubjectManagementProps) {
    const t = useTranslations("ClassSubjectManagement");
    const classSubjectApiClient = useClassSubjectApiClient();
    const userApiClient = useUserApiClient();

    const [isLoading, setIsLoading] = useState(true);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assignments, setAssignments] = useState<ClassSubjectAssignment[]>(
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

    const fetchAssignments = useCallback(
        async (query?: string, page = 1, signal?: AbortSignal) => {
            setIsLoading(true);
            try {
                const paginatedAssignments =
                    await classSubjectApiClient.listAssignedSubjects(
                        clazz.id,
                        query,
                        limit,
                        (page - 1) * limit,
                        signal,
                    );

                setAssignments(paginatedAssignments);
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
                setIsLoading(false);
            }
        },
        [clazz.id, classSubjectApiClient, limit, t],
    );

    useEffect(() => {
        if (searchQuery !== debouncedSearchQuery) {
            return;
        }

        const controller = new AbortController();

        void fetchAssignments(debouncedSearchQuery, page, controller.signal);

        return () => {
            controller.abort();
        };
    }, [
        fetchAssignments,
        searchQuery,
        debouncedSearchQuery,
        page,
        refreshTrigger,
    ]);

    const handleUpdateTeacher = async (
        assignmentId: number,
        teacher: ClassSubjectAssignment["teacher"] | null,
    ) => {
        try {
            await classSubjectApiClient.updateAssignedSubject(
                clazz.id,
                assignmentId,
                teacher?.id ?? null,
            );

            toaster.create({
                title: t("updateToast.successTitle"),
                description: t("updateToast.successMessage"),
                type: "success",
            });

            setAssignments((prev) =>
                prev.map((a) =>
                    a.id === assignmentId ? { ...a, teacher: teacher } : a,
                ),
            );
        } catch (e) {
            toaster.create({
                title: t("updateToast.errorTitle"),
                description:
                    e instanceof APIError
                        ? e.message
                        : t("updateToast.errorMessage"),
                type: "error",
            });

            // Trigger a refresh to reset the UI to the actual server state.
            setRefreshTrigger((prev) => prev + 1);
        }
    };

    const handleRemoveAssignment = async (
        assignmentId: number,
        subjectName: string,
    ) => {
        if (
            !confirm(
                t("remove.confirmation", {
                    subject: subjectName,
                    class: clazz.name,
                }),
            )
        ) {
            return;
        }

        try {
            await classSubjectApiClient.unassignSubject(clazz.id, assignmentId);

            toaster.create({
                title: t("remove.toast.successTitle"),
                description: t("remove.toast.successMessage", {
                    subject: subjectName,
                    class: clazz.name,
                }),
                type: "success",
            });

            // Trigger a refetch to correct pagination offsets and table data.
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
        <Box
            p={{ base: 4, md: 8 }}
            w="full"
            h="full"
            display="flex"
            flexDirection="column"
        >
            <Box mb={6}>
                <Heading as="h2" size={{ base: "lg", md: "xl" }} mb={2}>
                    {t("title", { class: clazz.name })}
                </Heading>
            </Box>

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
                    <Plus size={18} style={{ marginRight: "8px" }} />
                    {t("assignNewSubject")}
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
                {isLoading && assignments.length === 0 ? (
                    <Flex justify="center" align="center" h="200px">
                        <Spinner size="xl" />
                    </Flex>
                ) : (
                    <Table.Root variant="line" minW="800px">
                        <Table.Header>
                            <Table.Row>
                                <Table.ColumnHeader>
                                    {t("columns.subjectCode")}
                                </Table.ColumnHeader>

                                <Table.ColumnHeader>
                                    {t("columns.subjectName")}
                                </Table.ColumnHeader>

                                <Table.ColumnHeader>
                                    {t("columns.teacher")}
                                </Table.ColumnHeader>

                                <Table.ColumnHeader textAlign="right">
                                    {t("columns.actions")}
                                </Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>

                        <Table.Body>
                            {assignments.length > 0 ? (
                                assignments.map((assignment) => (
                                    <Table.Row key={assignment.id}>
                                        <Table.Cell fontWeight="medium">
                                            {assignment.subject.code}
                                        </Table.Cell>

                                        <Table.Cell>
                                            {assignment.subject.name}
                                        </Table.Cell>

                                        <Table.Cell>
                                            <Box maxW="300px">
                                                <AsyncSelect
                                                    placeholder={t(
                                                        "unassignedTeacherPlaceholder",
                                                    )}
                                                    value={
                                                        assignment.teacher
                                                            ? {
                                                                  value: assignment
                                                                      .teacher
                                                                      .id,
                                                                  label: assignment
                                                                      .teacher
                                                                      .name,
                                                              }
                                                            : null
                                                    }
                                                    onChange={(
                                                        selectedOption,
                                                    ) => {
                                                        void handleUpdateTeacher(
                                                            assignment.id,
                                                            selectedOption
                                                                ? {
                                                                      id: selectedOption.value,
                                                                      name: selectedOption.label,
                                                                  }
                                                                : null,
                                                        );
                                                    }}
                                                    fetchOptions={async (
                                                        query,
                                                        signal,
                                                    ) => {
                                                        const teachers =
                                                            await userApiClient.listUsers(
                                                                UserRole.teacher,
                                                                query,
                                                                10,
                                                                undefined,
                                                                signal,
                                                            );

                                                        return teachers.map(
                                                            (t) => ({
                                                                value: t.id,
                                                                label: t.name,
                                                            }),
                                                        );
                                                    }}
                                                />
                                            </Box>
                                        </Table.Cell>

                                        <Table.Cell textAlign="right">
                                            <Button
                                                aria-label={`remove-subject-${assignment.subject.code}`}
                                                size="sm"
                                                variant="ghost"
                                                colorPalette="red"
                                                onClick={() => {
                                                    void handleRemoveAssignment(
                                                        assignment.id,
                                                        assignment.subject.name,
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

            <Pagination
                page={page}
                hasMore={assignments.length >= limit}
                isLoading={isLoading}
                onPrevPage={() => {
                    setPage((p) => p - 1);
                }}
                onNextPage={() => {
                    setPage((p) => p + 1);
                }}
            />

            <AssignClassSubjectModal
                isOpen={isAssignModalOpen}
                clazz={clazz}
                onClose={() => {
                    setIsAssignModalOpen(false);
                }}
                onSuccess={() => {
                    // Reset to page 1 to see the new assignment.
                    setPage(1);
                    setRefreshTrigger((prev) => prev + 1);
                }}
            />
        </Box>
    );
}
