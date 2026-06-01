"use client";

import { useRouter } from "@/i18n/navigation";
import { useSubjectDashboardApiClient } from "@/providers/api/subject-dashboard-api-provider";
import {
    Box,
    Button,
    Flex,
    Grid,
    Separator,
    Spinner,
    Text,
} from "@chakra-ui/react";
import {
    SubjectDashboard as SubjectDashboardData,
    UserRole,
} from "@psb/shared/types";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "../layout/PageHeader";
import { toaster } from "../ui/toaster";

export interface SubjectDashboardProps {
    readonly classSubjectId: number;
    readonly role: UserRole;
}

export function SubjectDashboard({
    classSubjectId,
    role,
}: SubjectDashboardProps) {
    const t = useTranslations("SubjectDashboard");
    const apiClient = useSubjectDashboardApiClient();
    const router = useRouter();

    const [dashboard, setDashboard] = useState<SubjectDashboardData | null>(
        null,
    );
    const [isLoading, setIsLoading] = useState(true);

    const isTeacher = role === UserRole.teacher;

    const fetchDashboard = useCallback(
        async (signal?: AbortSignal) => {
            setIsLoading(true);

            try {
                const data = await apiClient.getDashboard(
                    classSubjectId,
                    signal,
                );

                setDashboard(data);
            } catch (e) {
                if (e instanceof Error && e.name === "AbortError") {
                    return;
                }

                toaster.create({
                    title: t("fetchErrorTitle"),
                    description: t("fetchErrorMessage"),
                    type: "error",
                });

                router.push("/subjects");
            } finally {
                if (!signal?.aborted) {
                    setIsLoading(false);
                }
            }
        },
        [apiClient, classSubjectId, router, t],
    );

    useEffect(() => {
        const controller = new AbortController();

        void fetchDashboard(controller.signal);

        return () => {
            controller.abort();
        };
    }, [fetchDashboard]);

    if (isLoading) {
        return (
            <>
                <PageHeader title="" backButtonUrl="/subjects" />

                <Flex justify="center" align="center" h="200px">
                    <Spinner size="xl" />
                </Flex>
            </>
        );
    }

    return (
        <>
            <PageHeader
                title={
                    dashboard
                        ? isTeacher
                            ? `${dashboard.subject.name} - ${dashboard.class.name}`
                            : dashboard.subject.name
                        : ""
                }
                backButtonUrl="/subjects"
                rightElement={
                    dashboard && (
                        <Text
                            color="gray.500"
                            fontWeight="medium"
                            display={{ base: "none", md: "block" }}
                        >
                            {t("sessionLabel", {
                                session: dashboard.class.session,
                                semester: dashboard.class.semester.toString(),
                            })}
                        </Text>
                    )
                }
            />

            <Grid
                templateColumns={{ base: "1fr", md: "1fr 1px 1fr" }}
                p={{ base: 4, md: 8 }}
                gap={0}
                w="full"
                minH="full"
            >
                {/* Materials column */}
                <Box pr={{ base: 0, md: 8 }} pb={{ base: 8, md: 0 }}>
                    <Flex justify="space-between" align="center" mb={4}>
                        <Text fontWeight="bold" fontSize="xl">
                            {t("materials")}
                        </Text>

                        {isTeacher && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    router.push(
                                        `/subjects/${classSubjectId.toString()}/materials/create`,
                                    );
                                }}
                            >
                                {t("addMaterial")}
                            </Button>
                        )}
                    </Flex>

                    {dashboard?.materials.length === 0 ? (
                        <Text color="gray.500">{t("noMaterials")}</Text>
                    ) : (
                        <Box>
                            {dashboard?.materials.map((material) => (
                                <Box key={material.id}>
                                    <Flex
                                        justify="space-between"
                                        align="flex-start"
                                        py={3}
                                    >
                                        <Box flex={1} pr={4}>
                                            <Link
                                                href={`/subjects/${classSubjectId.toString()}/materials/${material.id.toString()}`}
                                            >
                                                <Text
                                                    color="blue.500"
                                                    fontWeight="medium"
                                                    _hover={{
                                                        textDecoration:
                                                            "underline",
                                                    }}
                                                >
                                                    {material.title}
                                                </Text>
                                            </Link>

                                            {material.description && (
                                                <Text
                                                    color="gray.600"
                                                    fontSize="sm"
                                                    mt={1}
                                                >
                                                    {material.description}
                                                </Text>
                                            )}
                                        </Box>

                                        {isTeacher && (
                                            <Box
                                                color="gray.500"
                                                flexShrink={0}
                                            >
                                                {material.visible ? (
                                                    <Eye size={20} />
                                                ) : (
                                                    <EyeOff size={20} />
                                                )}
                                            </Box>
                                        )}
                                    </Flex>

                                    <Separator />
                                </Box>
                            ))}
                        </Box>
                    )}
                </Box>

                {/* Vertical divider on desktop */}
                <Separator
                    orientation="vertical"
                    display={{ base: "none", md: "block" }}
                />

                {/* Assignments column */}
                <Box pl={{ base: 0, md: 8 }} pt={{ base: 8, md: 0 }}>
                    <Flex justify="space-between" align="center" mb={4}>
                        <Text fontWeight="bold" fontSize="xl">
                            {t("assignments")}
                        </Text>

                        {isTeacher && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    router.push(
                                        `/subjects/${classSubjectId.toString()}/assignments/create`,
                                    );
                                }}
                            >
                                {t("addAssignment")}
                            </Button>
                        )}
                    </Flex>

                    {dashboard?.assignments.length === 0 ? (
                        <Text color="gray.500">{t("noAssignments")}</Text>
                    ) : (
                        <Box>
                            {dashboard?.assignments.map((assignment) => (
                                <Box key={assignment.id}>
                                    <Flex
                                        justify="space-between"
                                        align="flex-start"
                                        py={3}
                                    >
                                        <Box flex={1} pr={4}>
                                            <Link
                                                href={`/subjects/${classSubjectId.toString()}/assignments/${assignment.id.toString()}`}
                                            >
                                                <Text
                                                    color="blue.500"
                                                    fontWeight="medium"
                                                    _hover={{
                                                        textDecoration:
                                                            "underline",
                                                    }}
                                                >
                                                    {assignment.title}
                                                </Text>
                                            </Link>
                                        </Box>

                                        {isTeacher && (
                                            <Box
                                                color="gray.500"
                                                flexShrink={0}
                                            >
                                                {assignment.visible ? (
                                                    <Eye size={20} />
                                                ) : (
                                                    <EyeOff size={20} />
                                                )}
                                            </Box>
                                        )}
                                    </Flex>

                                    <Separator />
                                </Box>
                            ))}
                        </Box>
                    )}
                </Box>
            </Grid>
        </>
    );
}
