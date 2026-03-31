"use client";

import { APIError } from "@/api";
import { useUserApiClient } from "@/providers/api/user-api-provider";
import {
    Box,
    Button,
    Heading,
    HStack,
    Input,
    Text,
    VStack,
} from "@chakra-ui/react";
import { passwordRegex } from "@psb/shared/validator";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toaster } from "../ui/toaster";

export function AccountSettings() {
    const formT = useTranslations("Form");
    const t = useTranslations("AccountSettings");
    const userApiClient = useUserApiClient();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.SubmitEvent) => {
        e.preventDefault();
        setError(null);

        if (!currentPassword || !newPassword) {
            setError(formT("missingFields"));
            return;
        }

        if (!passwordRegex.test(newPassword)) {
            setError(t("invalidNewPassword"));
            return;
        }

        setIsLoading(true);

        userApiClient
            .updatePassword(currentPassword, newPassword)
            .then(() => {
                toaster.create({
                    title: t("passwordToastSuccessTitle"),
                    description: t("passwordToastSuccessMessage"),
                    type: "success",
                });

                setCurrentPassword("");
                setNewPassword("");
            })
            .catch((e: unknown) => {
                setError(
                    e instanceof APIError
                        ? e.message
                        : t("passwordToastErrorMessage"),
                );

                toaster.create({
                    title: t("passwordToastErrorTitle"),
                    description: t("passwordToastErrorMessage"),
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
                    <Text color="red.500" fontSize="sn" fontWeight="medium">
                        {error}
                    </Text>
                )}

                <Box w="full">
                    <HStack justify="space-between" mb={2}>
                        <Text fontWeight="medium">
                            {t("currentPasswordLabel")}
                        </Text>
                    </HStack>

                    <Input
                        type="password"
                        required
                        value={currentPassword}
                        placeholder={t("currentPasswordPlaceholder")}
                        onChange={(e) => {
                            setCurrentPassword(e.target.value);
                        }}
                        bg="gray.200"
                        border="none"
                        borderRadius="sm"
                        _focus={{ ring: 2, ringColor: "blue.500" }}
                    />
                </Box>

                <Box w="full">
                    <HStack justify="space-between" mb={2}>
                        <Text fontWeight="medium">{t("newPasswordLabel")}</Text>
                    </HStack>

                    <Input
                        type="password"
                        required
                        value={newPassword}
                        placeholder={t("newPasswordPlaceholder")}
                        onChange={(e) => {
                            setNewPassword(e.target.value);
                        }}
                        bg="gray.200"
                        border="none"
                        borderRadius="sm"
                        _focus={{ ring: 2, ringColor: "blue.500" }}
                    />

                    <Text fontSize="xs" color="gray.500" mt={2}>
                        {formT("passwordRequirements")}
                    </Text>
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
                    {t("passwordFormSubmit")}
                </Button>
            </VStack>
        </Box>
    );
}
