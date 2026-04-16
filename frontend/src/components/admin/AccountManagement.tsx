"use client";

import { useDebounce } from "@/hooks";
import { Link } from "@/i18n/navigation";
import { useUserApiClient } from "@/providers/api/user-api-provider";
import {
    Badge,
    Box,
    Button,
    Flex,
    Heading,
    Input,
    Spinner,
    Table,
} from "@chakra-ui/react";
import { UserListItem, UserRole } from "@psb/shared/types";
import { Plus, Search, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Pagination } from "../ui/Pagination";
import { toaster } from "../ui/toaster";
import { CreateUserModal } from "./CreateUserModal";

interface AccountManagementProps {
    currentUserId: number;
}

export function AccountManagement({ currentUserId }: AccountManagementProps) {
    const t = useTranslations("AccountManagement");
    const userApiClient = useUserApiClient();

    const [users, setUsers] = useState<UserListItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const limit = 10;

    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const fetchUsers = useCallback(
        async (query?: string, page = 1, signal?: AbortSignal) => {
            setIsLoading(true);

            try {
                const data = await userApiClient.listUsers(
                    undefined,
                    query,
                    limit,
                    (page - 1) * limit,
                    signal,
                );

                setUsers(data);
            } catch (e) {
                if (e instanceof Error && e.name === "AbortError") {
                    return;
                }

                toaster.create({
                    title: t("fetchUserToast.errorTitle"),
                    description: t("fetchUserToast.errorMessage"),
                    type: "error",
                });
            } finally {
                if (!signal?.aborted) {
                    setIsLoading(false);
                }
            }
        },
        [userApiClient, t],
    );

    useEffect(() => {
        // Prevent fetching if user is still actively typing.
        if (searchQuery !== debouncedSearchQuery) {
            return;
        }

        const controller = new AbortController();

        void fetchUsers(debouncedSearchQuery, page, controller.signal);

        return () => {
            controller.abort();
        };
    }, [fetchUsers, searchQuery, debouncedSearchQuery, page, refreshTrigger]);

    const handleDelete = (userId: number, userName: string) => {
        if (!confirm(t("deleteUser.confirmation", { name: userName }))) {
            return;
        }

        userApiClient
            .deleteUser(userId)
            .then(() => {
                toaster.create({
                    title: t("deleteUser.toast.successTitle"),
                    description: t("deleteUser.toast.successMessage", {
                        name: userName,
                    }),
                    type: "success",
                });

                setRefreshTrigger((prev) => prev + 1);
            })
            .catch(() => {
                toaster.create({
                    title: t("deleteUser.toast.errorTitle"),
                    description: t("deleteUser.toast.errorMessage"),
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
                    {t("registerButton")}
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
                    <Table.Root variant="line" minW="600px">
                        <Table.Header>
                            <Table.Row>
                                <Table.ColumnHeader>
                                    {t("columns.name")}
                                </Table.ColumnHeader>

                                <Table.ColumnHeader>
                                    {t("columns.identifier")}
                                </Table.ColumnHeader>

                                <Table.ColumnHeader>
                                    {t("columns.role")}
                                </Table.ColumnHeader>

                                <Table.ColumnHeader>
                                    {t("columns.status")}
                                </Table.ColumnHeader>

                                <Table.ColumnHeader textAlign="right">
                                    {t("columns.actions")}
                                </Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>

                        <Table.Body>
                            {users.length > 0 ? (
                                users.map((user) => (
                                    <Table.Row key={user.id}>
                                        <Table.Cell fontWeight="medium">
                                            {user.name}
                                        </Table.Cell>

                                        <Table.Cell color="gray.600">
                                            {user.identifier}
                                        </Table.Cell>

                                        <Table.Cell>
                                            <Badge
                                                colorPalette={
                                                    user.role ===
                                                    UserRole.administrator
                                                        ? "purple"
                                                        : user.role ===
                                                            UserRole.teacher
                                                          ? "blue"
                                                          : "green"
                                                }
                                            >
                                                {t(
                                                    `roles.${user.role.toString() as "0" | "1" | "2"}`,
                                                )}
                                            </Badge>
                                        </Table.Cell>

                                        <Table.Cell>
                                            <Badge
                                                colorPalette={
                                                    user.active
                                                        ? "green"
                                                        : "red"
                                                }
                                                variant="subtle"
                                            >
                                                {t(
                                                    `status.${user.active ? "active" : "inactive"}`,
                                                )}
                                            </Badge>
                                        </Table.Cell>

                                        <Table.Cell textAlign="right">
                                            <Button
                                                asChild
                                                variant="ghost"
                                                colorPalette="blue"
                                            >
                                                <Link
                                                    href={`/admin/users/${user.id.toString()}`}
                                                >
                                                    {t("actions.edit")}
                                                </Link>
                                            </Button>

                                            {user.id !== currentUserId && (
                                                <Button
                                                    aria-label={`delete-${user.identifier}`}
                                                    size="sm"
                                                    variant="ghost"
                                                    colorPalette="red"
                                                    onClick={() => {
                                                        handleDelete(
                                                            user.id,
                                                            user.name,
                                                        );
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            )}
                                        </Table.Cell>
                                    </Table.Row>
                                ))
                            ) : (
                                <Table.Row>
                                    <Table.Cell
                                        colSpan={5}
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
                hasMore={users.length >= limit}
                isLoading={isLoading}
                onPrevPage={() => {
                    setPage((p) => p - 1);
                }}
                onNextPage={() => {
                    setPage((p) => p + 1);
                }}
            />

            <CreateUserModal
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
        </Box>
    );
}
