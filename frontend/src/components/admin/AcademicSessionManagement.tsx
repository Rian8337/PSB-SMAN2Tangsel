"use client";

import { useDebounce } from "@/hooks";
import { useSessionApiClient } from "@/providers/api/session-api-provider";
import {
    Badge,
    Box,
    Button,
    Flex,
    Input,
    Spinner,
    Table,
} from "@chakra-ui/react";
import {
    AcademicSessionDTO,
    ValidSemester,
    ValidSession,
} from "@psb/shared/types";
import { Check, Plus, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "../layout/PageHeader";
import { Pagination } from "../ui/Pagination";
import { toaster } from "../ui/toaster";
import { CreateSessionModal } from "./CreateSessionModal";
import { TableDeleteButton } from "./TableDeleteButton";
import { TableEditButton } from "./TableEditButton";

export function AcademicSessionManagement() {
    const locale = useLocale();
    const t = useTranslations("AcademicSession");
    const sessionApiClient = useSessionApiClient();

    const [sessions, setSessions] = useState<AcademicSessionDTO[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateModalOpen, setisCreateModalOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const limit = 10;

    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const fetchSessions = useCallback(
        async (query?: string, page = 1, signal?: AbortSignal) => {
            setIsLoading(true);

            try {
                const data = await sessionApiClient.listSessions(
                    query,
                    limit,
                    (page - 1) * limit,
                    signal,
                );

                setSessions(data);
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
        [sessionApiClient, t],
    );

    useEffect(() => {
        // Prevent fetching if user is still actively typing.
        if (searchQuery !== debouncedSearchQuery) {
            return;
        }

        const controller = new AbortController();

        void fetchSessions(debouncedSearchQuery, page, controller.signal);

        return () => {
            controller.abort();
        };
    }, [
        fetchSessions,
        searchQuery,
        debouncedSearchQuery,
        page,
        refreshTrigger,
    ]);

    const handleDelete = (session: ValidSession, semester: ValidSemester) => {
        const tOptions = { session, semester: semester.toString() };

        if (!confirm(t("delete.confirmation", tOptions))) {
            return;
        }

        sessionApiClient
            .deleteSession(session, semester)
            .then(() => {
                toaster.create({
                    title: t("delete.toast.successTitle"),
                    description: t("delete.toast.successMessage", tOptions),
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

    const formatDate = (timestamp: number) =>
        new Date(timestamp).toLocaleDateString(locale, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });

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
                            setisCreateModalOpen(true);
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
                                        {t("columns.session")}
                                    </Table.ColumnHeader>

                                    <Table.ColumnHeader textAlign="center">
                                        {t("columns.semester")}
                                    </Table.ColumnHeader>

                                    <Table.ColumnHeader>
                                        {t("columns.startDate")}
                                    </Table.ColumnHeader>

                                    <Table.ColumnHeader>
                                        {t("columns.endDate")}
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
                                {sessions.length > 0 ? (
                                    sessions.map((session) => (
                                        <Table.Row
                                            key={`${session.session}-${session.semester.toString()}`}
                                        >
                                            <Table.Cell fontWeight="medium">
                                                {session.session}
                                            </Table.Cell>

                                            <Table.Cell textAlign="center">
                                                {session.semester}
                                            </Table.Cell>

                                            <Table.Cell color="gray.600">
                                                {formatDate(session.startTime)}
                                            </Table.Cell>

                                            <Table.Cell color="gray.600">
                                                {formatDate(session.endTime)}
                                            </Table.Cell>

                                            <Table.Cell textAlign="center">
                                                {session.active && (
                                                    <Badge
                                                        colorPalette="green"
                                                        variant="subtle"
                                                    >
                                                        <Check size={16} />
                                                    </Badge>
                                                )}
                                            </Table.Cell>

                                            <Table.Cell textAlign="right">
                                                <TableEditButton
                                                    href={`/admin/academic-years/edit?session=${encodeURIComponent(session.session)}&semester=${session.semester.toString()}`}
                                                    ariaLabel={`edit-${session.session}-semester-${session.semester.toString()}`}
                                                />

                                                {!session.active && (
                                                    <TableDeleteButton
                                                        ariaLabel={`delete-${session.session}-semester-${session.semester.toString()}`}
                                                        onClick={() => {
                                                            handleDelete(
                                                                session.session,
                                                                session.semester,
                                                            );
                                                        }}
                                                    />
                                                )}
                                            </Table.Cell>
                                        </Table.Row>
                                    ))
                                ) : (
                                    <Table.Row>
                                        <Table.Cell
                                            colSpan={6}
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
                    hasMore={sessions.length >= limit}
                    isLoading={isLoading}
                    onPrevPage={() => {
                        setPage((p) => p - 1);
                    }}
                    onNextPage={() => {
                        setPage((p) => p + 1);
                    }}
                />

                {isCreateModalOpen && (
                    <CreateSessionModal
                        isOpen={isCreateModalOpen}
                        onClose={() => {
                            setisCreateModalOpen(false);
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
