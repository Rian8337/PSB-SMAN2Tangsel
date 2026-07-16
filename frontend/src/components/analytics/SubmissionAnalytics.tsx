"use client";

import { useAnalyticsApiClient } from "@/providers/api/analytics-api-provider";
import {
    Box,
    Card,
    Flex,
    Heading,
    Separator,
    SimpleGrid,
    Spinner,
    Stat,
    Text,
} from "@chakra-ui/react";
import {
    SubmissionAnalytics as SubmissionAnalyticsData,
    ValidSemester,
    ValidSession,
} from "@psb/shared/types";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toaster } from "../ui/toaster";

export interface SubmissionAnalyticsProps {
    readonly session: ValidSession;
    readonly semester: ValidSemester;
}

const emptyAnalytics: SubmissionAnalyticsData = {
    summary: { onTime: 0, late: 0, missing: 0, pending: 0 },
    concerningStudents: [],
};

export function SubmissionAnalytics({
    session,
    semester,
}: SubmissionAnalyticsProps) {
    const t = useTranslations("SubmissionAnalytics");
    const analyticsApiClient = useAnalyticsApiClient();

    const [analytics, setAnalytics] =
        useState<SubmissionAnalyticsData>(emptyAnalytics);
    const [isPending, startTransition] = useTransition();

    const fetchAnalytics = useCallback(
        async (signal?: AbortSignal) => {
            try {
                const data = await analyticsApiClient.getSubmissionAnalytics(
                    session,
                    semester,
                    5,
                    signal,
                );

                setAnalytics(data);
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
        [analyticsApiClient, session, semester, t],
    );

    useEffect(() => {
        const controller = new AbortController();

        startTransition(() => fetchAnalytics(controller.signal));

        return () => {
            controller.abort();
        };
    }, [fetchAnalytics]);

    const { summary, concerningStudents } = analytics;
    const hasAssignmentData =
        summary.onTime + summary.late + summary.missing + summary.pending > 0;

    return (
        <Box p={{ base: 4, md: 8 }} w="full" h="full">
            {isPending ? (
                <Flex justify="center" align="center" h="200px">
                    <Spinner size="xl" />
                </Flex>
            ) : !hasAssignmentData ? (
                <Text color="gray.500">{t("emptyState")}</Text>
            ) : (
                <Flex direction="column" gap={6}>
                    <Card.Root>
                        <Card.Body>
                            <Heading size="md" mb={4}>
                                {t("title")}
                            </Heading>

                            <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
                                <Stat.Root>
                                    <Stat.Label>{t("onTime")}</Stat.Label>
                                    <Stat.ValueText color="green.500">
                                        {summary.onTime}
                                    </Stat.ValueText>
                                </Stat.Root>

                                <Stat.Root>
                                    <Stat.Label>{t("late")}</Stat.Label>
                                    <Stat.ValueText color="orange.500">
                                        {summary.late}
                                    </Stat.ValueText>
                                </Stat.Root>

                                <Stat.Root>
                                    <Stat.Label>{t("missing")}</Stat.Label>
                                    <Stat.ValueText color="red.500">
                                        {summary.missing}
                                    </Stat.ValueText>
                                </Stat.Root>

                                <Stat.Root>
                                    <Stat.Label>{t("pending")}</Stat.Label>
                                    <Stat.ValueText color="gray.500">
                                        {summary.pending}
                                    </Stat.ValueText>
                                </Stat.Root>
                            </SimpleGrid>
                        </Card.Body>
                    </Card.Root>

                    <Card.Root>
                        <Card.Body>
                            <Heading size="md" mb={4}>
                                {t("concernListTitle")}
                            </Heading>

                            {concerningStudents.length === 0 ? (
                                <Text color="gray.500">{t("noConcerns")}</Text>
                            ) : (
                                <Box>
                                    {concerningStudents.map((student) => (
                                        <Box
                                            key={`${student.studentId.toString()}-${student.classSubjectId.toString()}`}
                                        >
                                            <Flex
                                                justify="space-between"
                                                align="flex-start"
                                                py={3}
                                                gap={4}
                                            >
                                                <Box flex={1} pr={4}>
                                                    <Text fontWeight="medium">
                                                        {student.studentName}
                                                    </Text>

                                                    <Text
                                                        color="gray.600"
                                                        fontSize="sm"
                                                        mt={1}
                                                    >
                                                        {student.subject.name}{" "}
                                                        &middot;{" "}
                                                        {student.class.name}
                                                    </Text>
                                                </Box>

                                                <Flex
                                                    direction="column"
                                                    align="flex-end"
                                                    gap={1}
                                                    flexShrink={0}
                                                >
                                                    <Text
                                                        fontSize="sm"
                                                        color="orange.500"
                                                    >
                                                        {t("late")}:{" "}
                                                        {student.lateCount}
                                                    </Text>
                                                    <Text
                                                        fontSize="sm"
                                                        color="red.500"
                                                    >
                                                        {t("missing")}:{" "}
                                                        {student.missingCount}
                                                    </Text>
                                                </Flex>
                                            </Flex>

                                            <Separator />
                                        </Box>
                                    ))}
                                </Box>
                            )}
                        </Card.Body>
                    </Card.Root>
                </Flex>
            )}
        </Box>
    );
}
