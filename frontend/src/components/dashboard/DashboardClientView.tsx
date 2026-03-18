"use client";

import { ScheduleDTO } from "@psb/shared/types";
import { useTranslations } from "next-intl";
import { PageHeader } from "../layout/PageHeader";
import { Box, Button } from "@chakra-ui/react";
import { ScheduleGrid } from "../schedule/ScheduleGrid";

interface DashboardClientViewProps {
    name: string;
    schedules: ScheduleDTO[];
}

export function DashboardClientView({
    name,
    schedules,
}: DashboardClientViewProps) {
    const t = useTranslations("DashboardClientView");

    return (
        <>
            <PageHeader title={t("welcome", { name })} />

            <Box flex={1} p={8} overflowY="auto">
                <Box mb={4}>
                    <Button
                        variant="outline"
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
