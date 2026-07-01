"use client";

import { useClassApiClient } from "@/providers/api/class-api-provider";
import { Box, Button, Flex, Spinner, Text } from "@chakra-ui/react";
import { Class, ScheduleDTO } from "@psb/shared/types";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState, useTransition } from "react";
import { PageHeader } from "../layout/PageHeader";
import { ScheduleGrid } from "../schedule/ScheduleGrid";
import { toaster } from "../ui/toaster";
import { CreateScheduleModal } from "./CreateScheduleModal";
import { EditScheduleModal } from "./EditScheduleModal";

export interface ClassScheduleManagementProps {
    readonly clazz: Class;
}

export function ClassScheduleManagement({
    clazz,
}: ClassScheduleManagementProps) {
    const t = useTranslations("ClassScheduleManagement");
    const classApiClient = useClassApiClient();

    const [schedules, setSchedules] = useState<ScheduleDTO[]>([]);
    const [isPending, startTransition] = useTransition();
    const [, startBackgroundTransition] = useTransition();
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingScheduleId, setEditingScheduleId] = useState<number | null>(
        null,
    );

    const fetchSchedules = useCallback(
        async (signal?: AbortSignal) => {
            try {
                const data = await classApiClient.getClassSchedule(
                    clazz.id,
                    signal,
                );

                setSchedules(data);
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
        [classApiClient, clazz.id, t],
    );

    useEffect(() => {
        const controller = new AbortController();
        const isBackgroundRefresh = refreshTrigger > 0;

        if (isBackgroundRefresh) {
            startBackgroundTransition(() =>
                fetchSchedules(controller.signal),
            );
        } else {
            startTransition(() => fetchSchedules(controller.signal));
        }

        return () => {
            controller.abort();
        };
    }, [fetchSchedules, refreshTrigger]);

    return (
        <>
            <PageHeader
                title={t("title", { class: clazz.name })}
                backButtonUrl="/admin/classes"
                showSessionSwitcher={false}
                rightElement={
                    <Text
                        color="gray.500"
                        fontWeight="medium"
                        display={{ base: "none", md: "block" }}
                    >
                        {t("sessionLabel", {
                            session: clazz.session,
                            semester: clazz.semester.toString(),
                        })}
                    </Text>
                }
            />

            <Box
                p={{ base: 4, md: 8 }}
                w="full"
                h="full"
                display="flex"
                flexDirection="column"
            >
                <Flex justify="flex-end" mb={6}>
                    <Button
                        colorPalette="blue"
                        bg="blue.600"
                        color="white"
                        _hover={{ bg: "blue.700" }}
                        onClick={() => {
                            setIsCreateModalOpen(true);
                        }}
                    >
                        <Plus size={18} style={{ marginRight: "8px" }} />
                        {t("addButton")}
                    </Button>
                </Flex>

                <Box flex={1} w="full">
                    {isPending ? (
                        <Flex justify="center" align="center" h="400px">
                            <Spinner size="xl" />
                        </Flex>
                    ) : (
                        <ScheduleGrid
                            data={schedules}
                            editMode={true}
                            onScheduleClick={(id) => {
                                setEditingScheduleId(id);
                            }}
                        />
                    )}
                </Box>

                {isCreateModalOpen && (
                    <CreateScheduleModal
                        clazz={clazz}
                        isOpen={isCreateModalOpen}
                        onClose={() => {
                            setIsCreateModalOpen(false);
                        }}
                        onSuccess={() => {
                            setRefreshTrigger((prev) => prev + 1);
                        }}
                    />
                )}

                {editingScheduleId && (
                    <EditScheduleModal
                        scheduleId={editingScheduleId}
                        isOpen={!!editingScheduleId}
                        onClose={() => {
                            setEditingScheduleId(null);
                        }}
                        onSuccess={() => {
                            setRefreshTrigger((prev) => prev + 1);
                        }}
                    />
                )}
            </Box>
        </>
    );
}
