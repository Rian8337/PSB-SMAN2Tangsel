"use client";

import { useUserApiClient } from "@/providers/api/user-api-provider";
import { UserListItem, UserRole } from "@psb/shared/types";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toaster } from "../ui/toaster";
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
import { Plus, Search } from "lucide-react";

export function AccountManagement() {
    const t = useTranslations("AccountManagement");
    const userApiClient = useUserApiClient();

    const [users, setUsers] = useState<UserListItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);

        try {
            const data = await userApiClient.listUsers();

            setUsers(data);
        } catch {
            toaster.create({
                title: t("fetchUserToast.errorTitle"),
                description: t("fetchUserToast.errorMessage"),
                type: "error",
            });
        } finally {
            setIsLoading(false);
        }
    }, [userApiClient, t]);

    useEffect(() => {
        void fetchUsers();
    }, [fetchUsers]);

    const filteredUsers = users.filter((user) => {
        const query = searchQuery.toLowerCase();

        return (
            user.name.toLowerCase().includes(query) ||
            user.identifier.toLowerCase().includes(query)
        );
    });

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
                    colorScheme="blue"
                    bg="blue.600"
                    color="white"
                    _hover={{ bg: "blue.700" }}
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
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <Table.Row key={user.id}>
                                        <Table.Cell fontWeight="medium">
                                            {user.name}
                                        </Table.Cell>

                                        <Table.Cell color="gray.600">
                                            {user.identifier}
                                        </Table.Cell>

                                        <Table.Cell>
                                            <Badge
                                                colorScheme={
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
                                                colorScheme={
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
                                                variant="ghost"
                                                colorScheme="blue"
                                            >
                                                {t("actions.view")}
                                            </Button>
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
        </Box>
    );
}
