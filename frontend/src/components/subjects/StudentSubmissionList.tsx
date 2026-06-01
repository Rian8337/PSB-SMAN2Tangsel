"use client";

import { useRouter } from "@/i18n/navigation";
import { useSessionCode } from "@/hooks";
import { useSubjectAssignmentApiClient } from "@/providers/api/subject-assignment-api-provider";
import { useSubjectAssignmentSubmissionApiClient } from "@/providers/api/subject-assignment-submission-api-provider";
import {
    Box,
    Button,
    Flex,
    Heading,
    Input,
    Spinner,
    Table,
    Text,
} from "@chakra-ui/react";
import {
    AssignmentSubmissionRow,
    TeacherSubjectAssignment,
} from "@psb/shared/types";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "../layout/PageHeader";
import { toaster } from "../ui/toaster";

export interface StudentSubmissionListProps {
    readonly assignmentId: number;
    readonly classSubjectId: number;
}

function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export function StudentSubmissionList({
    assignmentId,
    classSubjectId,
}: StudentSubmissionListProps) {
    const sessionCode = useSessionCode();
    const t = useTranslations("StudentSubmissionList");
    const assignmentApiClient = useSubjectAssignmentApiClient();
    const submissionApiClient = useSubjectAssignmentSubmissionApiClient();
    const router = useRouter();

    const backButtonUrl = `/${sessionCode}/subjects/${classSubjectId.toString()}/assignments/${assignmentId.toString()}`;

    const [assignment, setAssignment] =
        useState<TeacherSubjectAssignment | null>(null);

    const [submissions, setSubmissions] = useState<
        AssignmentSubmissionRow[] | null
    >(null);

    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isDownloadingAll, setIsDownloadingAll] = useState(false);
    const [downloadingStudents, setDownloadingStudents] = useState(
        new Set<number>(),
    );

    const fetchData = useCallback(
        async (signal?: AbortSignal) => {
            setIsLoading(true);

            try {
                const [assignmentData, submissionData] = await Promise.all([
                    assignmentApiClient.getAssignment(assignmentId, signal),
                    submissionApiClient.getSubmissions(assignmentId, signal),
                ]);

                setAssignment(assignmentData as TeacherSubjectAssignment);
                setSubmissions(submissionData);
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
        [
            assignmentApiClient,
            submissionApiClient,
            assignmentId,
            router,
            t,
            backButtonUrl,
        ],
    );

    useEffect(() => {
        const controller = new AbortController();

        void fetchData(controller.signal);

        return () => {
            controller.abort();
        };
    }, [fetchData]);

    const filteredSubmissions = useMemo(() => {
        if (!submissions) {
            return [];
        }

        const query = search.trim().toLowerCase();

        if (!query) {
            return submissions;
        }

        return submissions.filter(
            (s) =>
                s.studentName.toLowerCase().includes(query) ||
                s.studentIdentifier.toLowerCase().includes(query),
        );
    }, [submissions, search]);

    const getSubmissionTimeColor = (submittedAt: string) => {
        if (!assignment?.dueAt) {
            return undefined;
        }

        return new Date(submittedAt) <= new Date(assignment.dueAt)
            ? "green.500"
            : "red.500";
    };

    const handleDownloadAll = () => {
        setIsDownloadingAll(true);

        submissionApiClient
            .downloadSubmissions(assignmentId)
            .then(({ blob, filename }) => {
                triggerDownload(
                    blob,
                    filename ?? `submissions-${assignmentId.toString()}.zip`,
                );
            })
            .catch(() => {
                toaster.create({
                    title: t("downloadErrorTitle"),
                    description: t("downloadErrorMessage"),
                    type: "error",
                });
            })
            .finally(() => {
                setIsDownloadingAll(false);
            });
    };

    const handleDownloadStudent = (studentId: number) => {
        setDownloadingStudents((prev) => new Set(prev).add(studentId));

        submissionApiClient
            .downloadSubmissions(assignmentId, studentId)
            .then(({ blob, filename }) => {
                triggerDownload(
                    blob,
                    filename ?? `submissions-${assignmentId.toString()}.zip`,
                );
            })
            .catch(() => {
                toaster.create({
                    title: t("downloadErrorTitle"),
                    description: t("downloadErrorMessage"),
                    type: "error",
                });
            })
            .finally(() => {
                setDownloadingStudents((prev) => {
                    const next = new Set(prev);
                    next.delete(studentId);
                    return next;
                });
            });
    };

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

    return (
        <>
            <PageHeader
                title={assignment?.subject.name ?? ""}
                backButtonUrl={backButtonUrl}
            />

            <Box p={{ base: 4, md: 8 }}>
                <Heading as="h3" size="lg" mb={1}>
                    {assignment?.title}
                </Heading>

                <Heading as="h4" size="md" mb={4}>
                    {t("heading")}
                </Heading>

                <Flex justify="space-between" align="center" mb={4} gap={3}>
                    <Flex align="center" gap={2}>
                        <Input
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                            }}
                            placeholder={t("search")}
                            maxW="300px"
                        />
                    </Flex>

                    <Button
                        variant="outline"
                        size="sm"
                        loading={isDownloadingAll}
                        onClick={handleDownloadAll}
                    >
                        {t("downloadAll")}
                    </Button>
                </Flex>

                <Table.Root>
                    <Table.Header>
                        <Table.Row>
                            <Table.ColumnHeader>
                                {t("columnId")}
                            </Table.ColumnHeader>

                            <Table.ColumnHeader>
                                {t("columnName")}
                            </Table.ColumnHeader>

                            <Table.ColumnHeader>
                                {t("columnSubmissionTime")}
                            </Table.ColumnHeader>

                            <Table.ColumnHeader>
                                {t("columnAction")}
                            </Table.ColumnHeader>
                        </Table.Row>
                    </Table.Header>

                    <Table.Body>
                        {filteredSubmissions.length === 0 ? (
                            <Table.Row>
                                <Table.Cell colSpan={4}>
                                    <Text color="gray.500">
                                        {t("noSubmissions")}
                                    </Text>
                                </Table.Cell>
                            </Table.Row>
                        ) : (
                            filteredSubmissions.map((submission) => (
                                <Table.Row key={submission.studentId}>
                                    <Table.Cell>
                                        {submission.studentIdentifier}
                                    </Table.Cell>

                                    <Table.Cell>
                                        {submission.studentName}
                                    </Table.Cell>

                                    <Table.Cell>
                                        <Text
                                            color={getSubmissionTimeColor(
                                                submission.submittedAt,
                                            )}
                                            fontWeight="bold"
                                        >
                                            {new Date(
                                                submission.submittedAt,
                                            ).toLocaleString()}
                                        </Text>
                                    </Table.Cell>

                                    <Table.Cell>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            loading={downloadingStudents.has(
                                                submission.studentId,
                                            )}
                                            onClick={() => {
                                                handleDownloadStudent(
                                                    submission.studentId,
                                                );
                                            }}
                                        >
                                            {t("download")}
                                        </Button>
                                    </Table.Cell>
                                </Table.Row>
                            ))
                        )}
                    </Table.Body>
                </Table.Root>
            </Box>
        </>
    );
}
