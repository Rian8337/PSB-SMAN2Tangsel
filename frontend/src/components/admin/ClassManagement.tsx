"use client";

import { useDebounce } from "@/hooks";
import { Link } from "@/i18n/navigation";
import { useClassApiClient } from "@/providers/api/class-api-provider";
import { useSessionApiClient } from "@/providers/api/session-api-provider";
import {
    Box,
    Button,
    Flex,
    Input,
    Spinner,
    Table,
    Text,
} from "@chakra-ui/react";
import { AcademicSessionDTO, Class } from "@psb/shared/types";
import {
    BookOpen,
    CalendarDays,
    Plus,
    Search,
    Trash2,
    Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "../layout/PageHeader";
import { Pagination } from "../ui/Pagination";
import { toaster } from "../ui/toaster";
import { CreateClassModal } from "./CreateClassModal";
import { APIError } from "@/api";

export function ClassManagement() {
    const t = useTranslations("ClassManagement");
    const classApiClient = useClassApiClient();
    const sessionApiClient = useSessionApiClient();

    const [activeSession, setActiveSession] =
        useState<AcademicSessionDTO | null>(null);

    const [classes, setClasses] = useState<Class[]>([]);

    const [isLoadingSession, setIsLoadingSession] = useState(true);
    const [isLoadingClasses, setIsLoadingClasses] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const limit = 10;

    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    useEffect(() => {
        const fetchActiveSession = async (signal?: AbortSignal) => {
            setIsLoadingSession(true);

            try {
                const session = await sessionApiClient.getActive(signal);
                setActiveSession(session);
            } catch (e) {
                if (e instanceof Error && e.name === "AbortError") {
                    return;
                }

                if (e instanceof APIError && e.code === 404) {
                    return;
                }

                toaster.create({
                    title: t("fetchSessionToast.errorTitle"),
                    description: t("fetchSessionToast.errorMessage"),
                    type: "error",
                });
            } finally {
                if (!signal?.aborted) {
                    setIsLoadingSession(false);
                }
            }
        };

        const controller = new AbortController();

        void fetchActiveSession(controller.signal);

        return () => {
            controller.abort();
        };
    }, [sessionApiClient, t]);

    const fetchClasses = useCallback(
        async (query?: string, page = 1, signal?: AbortSignal) => {
            if (!activeSession) {
                return;
            }

            setIsLoadingClasses(true);

            try {
                const data = await classApiClient.listClasses({
                    session: activeSession.session,
                    semester: activeSession.semester,
                    query,
                    limit,
                    offset: (page - 1) * limit,
                    signal,
                });

                setClasses(data);
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
                    setIsLoadingClasses(false);
                }
            }
        },
        [classApiClient, activeSession, t],
    );

    // Trigger Class Fetching
    useEffect(() => {
        if (!activeSession) {
            return;
        }

        if (searchQuery !== debouncedSearchQuery) {
            return;
        }

        const controller = new AbortController();

        void fetchClasses(debouncedSearchQuery, page, controller.signal);

        return () => {
            controller.abort();
        };
    }, [
        fetchClasses,
        searchQuery,
        debouncedSearchQuery,
        page,
        refreshTrigger,
        activeSession,
    ]);

    const handleDelete = (id: number, name: string) => {
        if (!confirm(t("delete.confirmation", { name }))) {
            return;
        }

        classApiClient
            .deleteClass(id)
            .then(() => {
                toaster.create({
                    title: t("delete.toast.successTitle"),
                    description: t("delete.toast.successMessage", { name }),
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

    const header = (
        <PageHeader
            title={t("title")}
            rightElement={
                <Text
                    color="gray.500"
                    fontWeight="medium"
                    display={{ base: "none", md: "block" }}
                >
                    {t("activeSessionLabel", {
                        session: activeSession?.session ?? "",
                        semester: activeSession?.semester.toString() ?? "",
                    })}
                </Text>
            }
        />
    );

    if (isLoadingSession) {
        return (
            <>
                {header}

                <Flex justify="center" align="center" h="100vh">
                    <Spinner size="xl" />
                </Flex>
            </>
        );
    }

    if (!activeSession) {
        return (
            <>
                {header}

                <Flex
                    justify="center"
                    align="center"
                    h="100vh"
                    direction="column"
                    gap={4}
                >
                    <Text color="gray.500" fontSize="lg">
                        {t("noActiveSession")}
                    </Text>
                </Flex>
            </>
        );
    }

    return (
        <>
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
                    {isLoadingClasses ? (
                        <Flex justify="center" align="center" h="200px">
                            <Spinner size="xl" />
                        </Flex>
                    ) : (
                        <Table.Root variant="line" minW="800px">
                            <Table.Header>
                                <Table.Row>
                                    <Table.ColumnHeader>
                                        {t("columns.name")}
                                    </Table.ColumnHeader>

                                    <Table.ColumnHeader textAlign="right">
                                        {t("columns.actions")}
                                    </Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>

                            <Table.Body>
                                {classes.length > 0 ? (
                                    classes.map((c) => (
                                        <Table.Row key={c.id}>
                                            <Table.Cell fontWeight="medium">
                                                {c.name}
                                            </Table.Cell>

                                            <Table.Cell textAlign="right">
                                                <Button
                                                    asChild
                                                    variant="ghost"
                                                    colorPalette="blue"
                                                >
                                                    <Link
                                                        href={`/admin/classes/${c.id.toString()}`}
                                                    >
                                                        {t("actions.edit")}
                                                    </Link>
                                                </Button>

                                                <Button
                                                    asChild
                                                    variant="ghost"
                                                    colorPalette="green"
                                                >
                                                    <Link
                                                        href={`/admin/classes/${c.id.toString()}/subjects`}
                                                        aria-label={`manage-subjects-${c.name}`}
                                                    >
                                                        <BookOpen size={16} />
                                                    </Link>
                                                </Button>

                                                <Button
                                                    asChild
                                                    variant="ghost"
                                                    size="sm"
                                                    colorPalette="blue"
                                                    aria-label={`manage-students-${c.id.toString()}`}
                                                >
                                                    <Link
                                                        href={`/admin/classes/${c.id.toString()}/students`}
                                                    >
                                                        <Users size={16} />
                                                    </Link>
                                                </Button>

                                                <Button
                                                    asChild
                                                    variant="ghost"
                                                    colorPalette="purple"
                                                >
                                                    <Link
                                                        href={`/admin/classes/${c.id.toString()}/schedules`}
                                                        aria-label={`manage-schedules-${c.name}`}
                                                    >
                                                        <CalendarDays
                                                            size={16}
                                                        />
                                                    </Link>
                                                </Button>

                                                <Button
                                                    aria-label={`delete-${c.name}`}
                                                    size="sm"
                                                    variant="ghost"
                                                    colorPalette="red"
                                                    onClick={() => {
                                                        handleDelete(
                                                            c.id,
                                                            c.name,
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
                                            colSpan={2}
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
                    hasMore={classes.length >= limit}
                    isLoading={isLoadingClasses}
                    onPrevPage={() => {
                        setPage((p) => p - 1);
                    }}
                    onNextPage={() => {
                        setPage((p) => p + 1);
                    }}
                />

                {isCreateModalOpen && (
                    <CreateClassModal
                        activeSession={activeSession}
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
