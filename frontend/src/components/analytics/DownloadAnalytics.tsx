"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { useSessionCode } from "@/hooks";
import { Link } from "@/i18n/navigation";
import { useAnalyticsApiClient } from "@/providers/api/analytics-api-provider";
import {
    Badge,
    Box,
    Card,
    Flex,
    Heading,
    Separator,
    Spinner,
    Text,
} from "@chakra-ui/react";
import {
    DownloadAnalytics as DownloadAnalyticsData,
    ValidSemester,
    ValidSession,
} from "@psb/shared/types";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { toaster } from "../ui/toaster";

export interface DownloadAnalyticsProps {
    readonly session: ValidSession;
    readonly semester: ValidSemester;
}

const emptyAnalytics: DownloadAnalyticsData = {
    timeSeries: [],
    topAttachments: [],
};

export function DownloadAnalytics({
    session,
    semester,
}: DownloadAnalyticsProps) {
    const sessionCode = useSessionCode();
    const t = useTranslations("Analytics");
    const analyticsApiClient = useAnalyticsApiClient();

    const [analytics, setAnalytics] =
        useState<DownloadAnalyticsData>(emptyAnalytics);
    const [isPending, startTransition] = useTransition();

    const fetchAnalytics = useCallback(
        async (signal?: AbortSignal) => {
            try {
                const data = await analyticsApiClient.getDownloadAnalytics(
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

    return (
        <>
            <PageHeader
                title={t("title")}
                backButtonUrl={`/${sessionCode}/dashboard`}
            />

            <Box p={{ base: 4, md: 8 }} w="full" h="full">
                {isPending ? (
                    <Flex justify="center" align="center" h="200px">
                        <Spinner size="xl" />
                    </Flex>
                ) : analytics.topAttachments.length === 0 ? (
                    <Text color="gray.500">{t("emptyState")}</Text>
                ) : (
                    <Flex direction="column" gap={6}>
                        <Card.Root>
                            <Card.Body>
                                <Heading size="md" mb={4}>
                                    {t("chartTitle")}
                                </Heading>

                                <Box h="300px" w="full">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <BarChart data={analytics.timeSeries}>
                                            <CartesianGrid
                                                stroke="#E2E8F0"
                                                vertical={false}
                                            />
                                            <XAxis
                                                dataKey="weekStart"
                                                stroke="#A0AEC0"
                                                tick={{
                                                    fill: "#4A5568",
                                                    fontSize: 12,
                                                }}
                                            />
                                            <YAxis
                                                allowDecimals={false}
                                                stroke="#A0AEC0"
                                                tick={{
                                                    fill: "#4A5568",
                                                    fontSize: 12,
                                                }}
                                            />
                                            <Tooltip
                                                cursor={{
                                                    fill: "#EDF2F7",
                                                }}
                                            />
                                            <Bar
                                                dataKey="count"
                                                fill="#3182CE"
                                                radius={[4, 4, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Card.Body>
                        </Card.Root>

                        <Card.Root>
                            <Card.Body>
                                <Heading size="md" mb={4}>
                                    {t("topListTitle")}
                                </Heading>

                                <Box>
                                    {analytics.topAttachments.map(
                                        (attachment) => (
                                            <Box key={attachment.attachmentId}>
                                                <Flex
                                                    justify="space-between"
                                                    align="flex-start"
                                                    py={3}
                                                    gap={4}
                                                >
                                                    <Box flex={1} pr={4}>
                                                        <Link
                                                            href={`/${sessionCode}/subjects/${attachment.classSubjectId.toString()}/${
                                                                attachment.type ===
                                                                "material"
                                                                    ? "materials"
                                                                    : "assignments"
                                                            }/${attachment.contentId.toString()}`}
                                                        >
                                                            <Text
                                                                color="blue.500"
                                                                fontWeight="medium"
                                                                _hover={{
                                                                    textDecoration:
                                                                        "underline",
                                                                }}
                                                            >
                                                                {
                                                                    attachment.contentTitle
                                                                }
                                                            </Text>
                                                        </Link>

                                                        <Text
                                                            color="gray.600"
                                                            fontSize="sm"
                                                            mt={1}
                                                        >
                                                            {
                                                                attachment
                                                                    .subject
                                                                    .name
                                                            }{" "}
                                                            &middot;{" "}
                                                            {
                                                                attachment.class
                                                                    .name
                                                            }
                                                        </Text>
                                                    </Box>

                                                    <Badge
                                                        colorPalette="blue"
                                                        variant="subtle"
                                                        flexShrink={0}
                                                    >
                                                        <Download size={14} />
                                                        {
                                                            attachment.downloadCount
                                                        }
                                                    </Badge>
                                                </Flex>

                                                <Separator />
                                            </Box>
                                        ),
                                    )}
                                </Box>
                            </Card.Body>
                        </Card.Root>
                    </Flex>
                )}
            </Box>
        </>
    );
}
