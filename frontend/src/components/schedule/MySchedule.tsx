"use client";

import { useScheduleApiClient } from "@/providers/api/schedule-api-provider";
import { Box, Button } from "@chakra-ui/react";
import { ScheduleDTO } from "@psb/shared/types";
import { useTranslations } from "next-intl";
import { PageHeader } from "../layout/PageHeader";
import { ScheduleGrid } from "./ScheduleGrid";
import { toaster } from "../ui/toaster";

interface MyScheduleClientViewProps {
    schedules: ScheduleDTO[];
}

export function MySchedule({ schedules }: MyScheduleClientViewProps) {
    const t = useTranslations("Dashboard");
    const tMy = useTranslations("MySchedule");
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
            <PageHeader title={tMy("title")} />

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
                        {tMy("downloadButton")}
                    </Button>
                </Box>

                <ScheduleGrid data={schedules} />
            </Box>
        </>
    );
}
