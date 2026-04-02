"use client";

import { useRouter } from "@/i18n/navigation";
import { useUserApiClient } from "@/providers/api/user-api-provider";
import { UserListItem } from "@psb/shared/types";
import { useTranslations } from "next-intl";
import React, { useState } from "react";
import { toaster } from "../ui/toaster";
import {
    Box,
    Button,
    Heading,
    HStack,
    Input,
    Switch,
    Text,
    VStack,
} from "@chakra-ui/react";
import { APIError } from "@/api";

export interface EditUserFormProps {
    readonly user: UserListItem;
}

export function EditUserForm({ user }: EditUserFormProps) {
    const formT = useTranslations("Form");
    const t = useTranslations("EditUser");
    const userApiClient = useUserApiClient();
    const router = useRouter();

    const [name, setName] = useState(user.name);
    const [isActive, setIsActive] = useState(user.active);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.SubmitEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError(formT("missingFields"));
            return;
        }

        setIsLoading(true);

        userApiClient
            .updateUser(user.id, name, isActive)
            .then(() => {
                toaster.create({
                    title: t("toast.successTitle"),
                    description: t("toast.successMessage", { name }),
                    type: "success",
                });

                router.push("/admin/users");
                router.refresh();
            })
            .catch((e: unknown) => {
                setError(
                    e instanceof APIError ? e.message : t("toast.errorMessage"),
                );

                toaster.create({
                    title: t("toast.errorTitle"),
                    description: t("toast.errorMessage"),
                    type: "error",
                });
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    return (
        <Box p={8} maxW="md">
            <VStack
                align="flex-start"
                spaceY={6}
                as="form"
                onSubmit={handleSubmit}
            >
                <Heading as="h2" size="xl">
                    {t("title")}
                </Heading>

                {error && (
                    <Text color="red.500" fontSize="sm" fontWeight="medium">
                        {error}
                    </Text>
                )}

                <Box w="full">
                    <HStack justify="space-between" mb={2}>
                        <Text fontWeight="medium">
                            {t("fields.identifier.label")}
                        </Text>
                    </HStack>

                    <Input
                        name="identifier"
                        value={user.identifier}
                        readOnly
                        disabled
                        bg="gray.200"
                        border="none"
                        borderRadius="sm"
                        color="gray"
                        cursor="not-allowed"
                    />
                </Box>

                <Box w="full">
                    <HStack justify="space-between" mb={2}>
                        <Text fontWeight="medium">
                            {t("fields.name.label")}
                        </Text>
                    </HStack>

                    <Input
                        name="name"
                        value={user.name}
                        placeholder={t("fields.name.placeholder")}
                        bg="gray.200"
                        border="none"
                        borderRadius="sm"
                        onChange={(e) => {
                            setName(e.target.value);
                        }}
                        _focus={{ ring: 2, ringColor: "blue.500" }}
                    />
                </Box>

                <Box w="full">
                    <HStack justify="space-between" mb={2}>
                        <Text fontWeight="medium">
                            {t("fields.active.label")}
                        </Text>
                    </HStack>

                    <Switch.Root
                        colorPalette="blue"
                        checked={isActive}
                        onCheckedChange={(e) => {
                            setIsActive(e.checked);
                        }}
                    >
                        <Switch.HiddenInput />
                        <Switch.Control>
                            <Switch.Thumb />
                        </Switch.Control>
                    </Switch.Root>
                </Box>

                <Button
                    type="submit"
                    variant="outline"
                    borderColor="black"
                    color="black"
                    borderRadius="sm"
                    loading={isLoading}
                    _hover={{ bg: "gray.50" }}
                >
                    {t("updateButton")}
                </Button>
            </VStack>
        </Box>
    );
}
