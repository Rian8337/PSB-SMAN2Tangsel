"use client";

import { backendBaseUrl } from "@/api/backendBaseUrl";
import { useRouter } from "@/i18n/navigation";
import { useSubjectAssignmentApiClient } from "@/providers/api/subject-assignment-api-provider";
import {
    Box,
    Button,
    Flex,
    HStack,
    Heading,
    Input,
    Separator,
    Spinner,
    Text,
} from "@chakra-ui/react";
import {
    StudentSubjectAssignment,
    TeacherSubjectAssignment,
    UserRole,
} from "@psb/shared/types";
import { FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "../layout/PageHeader";
import { toaster } from "../ui/toaster";

export interface SubjectAssignmentProps {
    readonly assignmentId: number;
    readonly classSubjectId: number;
    readonly role: UserRole;
}

export function SubjectAssignment({
    assignmentId,
    classSubjectId,
    role,
}: SubjectAssignmentProps) {
    const t = useTranslations("SubjectAssignment");
    const apiClient = useSubjectAssignmentApiClient();
    const router = useRouter();

    const [assignment, setAssignment] = useState<
        StudentSubjectAssignment | TeacherSubjectAssignment | null
    >(null);
    const [isLoading, setIsLoading] = useState(true);

    const isStudent = role === UserRole.student;
    const backButtonUrl = `/subjects/${classSubjectId.toString()}`;

    const fetchAssignment = useCallback(
        async (signal?: AbortSignal) => {
            setIsLoading(true);

            try {
                const data = await apiClient.getAssignment(
                    assignmentId,
                    signal,
                );

                setAssignment(data);
            } catch (e) {
                if (e instanceof Error && e.name === "AbortError") {
                    return;
                }

                toaster.create({
                    title: t("fetchErrorTitle"),
                    description: t("fetchErrorMessage"),
                    type: "error",
                });

                router.push(backButtonUrl);
            } finally {
                if (!signal?.aborted) {
                    setIsLoading(false);
                }
            }
        },
        [apiClient, assignmentId, router, t, backButtonUrl],
    );

    useEffect(() => {
        const controller = new AbortController();

        void fetchAssignment(controller.signal);

        return () => {
            controller.abort();
        };
    }, [fetchAssignment]);

    if (isLoading) {
        return (
            <>
                <PageHeader title="" backButtonUrl={backButtonUrl} />

                <Flex justify="center" align="center" h="200px">
                    <Spinner size="xl" />
                </Flex>
            </>
        );
    }

    const studentAssignment =
        assignment && "submission" in assignment ? assignment : null;

    const teacherAssignment =
        assignment && "visible" in assignment ? assignment : null;

    return (
        <>
            <PageHeader
                title={assignment?.subject.name ?? ""}
                backButtonUrl={backButtonUrl}
            />

            <Box p={{ base: 4, md: 8 }}>
                <Heading as="h3" size="lg" mb={2}>
                    {assignment?.title}
                </Heading>

                {assignment?.description && (
                    <Text mb={4}>{assignment.description}</Text>
                )}

                <Box mb={4}>
                    {assignment?.attachments.length === 0 ? (
                        <Text color="gray.500">{t("noAttachments")}</Text>
                    ) : (
                        <Flex direction="column" gap={2}>
                            {assignment?.attachments.map((attachment) => (
                                <Flex
                                    key={attachment.id}
                                    align="center"
                                    gap={2}
                                >
                                    <FileText size={18} />
                                    <a
                                        href={`${backendBaseUrl}/assignments/${assignmentId.toString()}/attachments/${attachment.id.toString()}`}
                                        download
                                    >
                                        <Text
                                            color="blue.500"
                                            _hover={{
                                                textDecoration: "underline",
                                            }}
                                        >
                                            {attachment.name}
                                        </Text>
                                    </a>
                                </Flex>
                            ))}
                        </Flex>
                    )}
                </Box>

                {assignment?.dueAt && (
                    <Text fontWeight="bold" color="green.500" mb={4}>
                        {t("dueAt")}{" "}
                        {new Date(assignment.dueAt).toLocaleString()}
                    </Text>
                )}

                <Text fontSize="sm" color="gray.500">
                    {t("createdAt")}{" "}
                    {assignment
                        ? new Date(assignment.createdAt).toLocaleDateString()
                        : ""}
                </Text>

                <Text fontSize="sm" color="gray.500" mb={isStudent ? 0 : 4}>
                    {t("lastUpdatedAt")}{" "}
                    {assignment
                        ? new Date(
                              assignment.lastUpdatedAt,
                          ).toLocaleDateString()
                        : ""}
                </Text>

                {isStudent && studentAssignment && (
                    <>
                        <Separator my={6} />

                        <Heading as="h4" size="md" mb={4}>
                            {t("submission")}
                        </Heading>

                        {studentAssignment.submission ? (
                            <>
                                <Flex direction="column" gap={2} mb={3}>
                                    {studentAssignment.submission.attachments.map(
                                        (attachment) => (
                                            <Flex
                                                key={attachment.id}
                                                align="center"
                                                gap={2}
                                            >
                                                <FileText size={18} />
                                                <Text color="blue.500">
                                                    {attachment.name}
                                                </Text>
                                            </Flex>
                                        ),
                                    )}
                                </Flex>

                                <Text
                                    fontWeight="bold"
                                    color="green.500"
                                    mb={4}
                                >
                                    {t("submittedAt")}{" "}
                                    {new Date(
                                        studentAssignment.submission
                                            .submittedAt,
                                    ).toLocaleString()}
                                </Text>

                                <HStack gap={2}>
                                    <Button variant="outline" size="sm">
                                        {t("editButton")}
                                    </Button>

                                    <Button variant="outline" size="sm">
                                        {t("removeButton")}
                                    </Button>
                                </HStack>
                            </>
                        ) : (
                            <Flex direction="column" gap={3} mt={2}>
                                <Input
                                    type="file"
                                    multiple
                                    aria-label={t("uploadLabel")}
                                />

                                <Box>
                                    <Button variant="outline" size="sm">
                                        {t("submitButton")}
                                    </Button>
                                </Box>
                            </Flex>
                        )}
                    </>
                )}

                {!isStudent && teacherAssignment && (
                    <HStack gap={2} mt={4}>
                        <Button variant="outline" size="sm">
                            {t("editAssignment")}
                        </Button>

                        <Button variant="outline" size="sm">
                            {t("deleteAssignment")}
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                router.push(
                                    `/subjects/${classSubjectId.toString()}/assignments/${assignmentId.toString()}/submissions`,
                                );
                            }}
                        >
                            {t("studentSubmissions")}
                        </Button>

                        <Button variant="outline" size="sm">
                            {teacherAssignment.visible
                                ? t("hideFromStudents")
                                : t("showToStudents")}
                        </Button>
                    </HStack>
                )}
            </Box>
        </>
    );
}
