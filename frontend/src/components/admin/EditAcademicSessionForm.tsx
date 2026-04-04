"use client";

import { useRouter } from "@/i18n/navigation";
import { useSessionApiClient } from "@/providers/api/session-api-provider";
import { AcademicSessionDTO } from "@psb/shared/types";
import { useTranslations } from "next-intl";
import React, { useState } from "react";
import { toaster } from "../ui/toaster";
import { APIError } from "@/api";
import {
    Box,
    Button,
    Heading,
    HStack,
    Input,
    Text,
    VStack,
} from "@chakra-ui/react";
import { Switch } from "../ui/switch";

export interface EditAcademicSessionFormProps {
    readonly session: AcademicSessionDTO;
}

export function EditAcademicSessionForm({
    session,
}: EditAcademicSessionFormProps) {
    const formT = useTranslations("Form");
    const t = useTranslations("EditAcademicSession");
    const sessionApiClient = useSessionApiClient();
    const router = useRouter();

    const formatDate = (timestamp: number) => {
        const d = new Date(timestamp);
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, "0");
        const day = d.getDate().toString().padStart(2, "0");

        return `${year.toString()}-${month}-${day}`;
    };

    const [startTime, setStartTime] = useState(formatDate(session.startTime));
    const [endTime, setEndTime] = useState(formatDate(session.endTime));
    const [isActive, setIsActive] = useState(session.active);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.SubmitEvent) => {
        e.preventDefault();
        setError(null);

        if (!startTime || !endTime) {
            setError(formT("missingFields"));
            return;
        }

        const startTimestamp = new Date(startTime).getTime();
        const endTimestamp = new Date(endTime).getTime();

        if (Number.isNaN(startTimestamp) || Number.isNaN(endTimestamp)) {
            setError(formT("invalidDate"));
            return;
        }

        if (startTimestamp >= endTimestamp) {
            setError(formT("invalidDateRange"));
            return;
        }

        setIsLoading(true);

        sessionApiClient
            .updateSession(
                session.session,
                session.semester,
                startTimestamp,
                endTimestamp,
                isActive,
            )
            .then(() => {
                toaster.create({
                    title: t("toast.successTitle"),
                    description: t("toast.successMessage", {
                        session: session.session,
                        semester: session.semester.toString(),
                    }),
                    type: "success",
                });

                router.push("/admin/academic-year");
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
                            {t("fields.session.label")}
                        </Text>

                        <Input
                            name="session"
                            value={`${session.session} - ${t("fields.semester.label")} ${session.semester.toString()}`}
                            readOnly
                            disabled
                            bg="gray.200"
                            border="none"
                            borderRadius="sm"
                            color="gray.500"
                            cursor="not-allowed"
                        />
                    </HStack>
                </Box>

                <Box w="full">
                    <HStack justify="space-between" mb={2}>
                        <Text fontWeight="medium">
                            {t("fields.startDate.label")}
                        </Text>
                    </HStack>

                    <Input
                        name="startTime"
                        type="date"
                        required
                        value={startTime}
                        bg="gray.200"
                        border="none"
                        borderRadius="sm"
                        onChange={(e) => {
                            setStartTime(e.target.value);
                        }}
                        _focus={{ ring: 2, ringColor: "blue.500" }}
                    />
                </Box>

                <Box w="full">
                    <HStack justify="space-between" mb={2}>
                        <Text fontWeight="medium">
                            {t("fields.endDate.label")}
                        </Text>
                    </HStack>

                    <Input
                        name="endTime"
                        type="date"
                        required
                        value={endTime}
                        bg="gray.200"
                        border="none"
                        borderRadius="sm"
                        onChange={(e) => {
                            setEndTime(e.target.value);
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

                    <Switch
                        name="active"
                        colorPalette="blue"
                        checked={isActive}
                        onCheckedChange={(e) => {
                            setIsActive(e.checked);
                        }}
                    />
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
