"use client";

import { useScheduleApiClient } from "@/providers/api/schedule-api-provider";
import { Box, Button } from "@chakra-ui/react";
import { ScheduleDTO } from "@psb/shared/types";
import { useTranslations } from "next-intl";
import { PageHeader } from "../layout/PageHeader";
import { ScheduleGrid } from "../schedule/ScheduleGrid";
import { toaster } from "../ui/toaster";

interface DashboardClientViewProps {
    name: string;
    schedules: ScheduleDTO[];
}

export function DashboardClientView({
    name,
    schedules,
}: DashboardClientViewProps) {
    const t = useTranslations("Dashboard");
    const scheduleApiClient = useScheduleApiClient();

    function handleDownload() {
        scheduleApiClient
            .download()
            .then(({ blob, filename }) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");

                a.style.display = "none";
                a.href = url;

                a.download = filename ?? `${t("scheduleFilename")}.ics`;
                document.body.appendChild(a);
                a.click();

                URL.revokeObjectURL(url);
                document.body.removeChild(a);
            })
            .catch(() => {
                toaster.create({
                    title: t("downloadScheduleErrorTitle"),
                    description: t("downloadScheduleErrorMessage"),
                    type: "error",
                    duration: 5000,
                    closable: true,
                });
            });
    }

    return (
        <>
            <PageHeader title={t("welcome", { name })} />

            <Box flex={1} p={8} overflowY="auto">
                <Box mb={4}>
                    <Button
                        variant="outline"
                        onClick={handleDownload}
                        borderColor="black"
                        color="black"
                        borderWidth="1px"
                        borderRadius="none"
                        _hover={{ bg: "blackAlpha.100" }}
                    >
                        {t("downloadSchedule")}
                    </Button>
                </Box>

                <ScheduleGrid data={schedules} />
            </Box>
        </>
    );
}
