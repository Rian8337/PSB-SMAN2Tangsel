"use client";

import { Box, Button } from "@chakra-ui/react";
import { ScheduleDTO } from "@psb/shared/types";
import { ScheduleGrid } from "./ScheduleGrid";
import { useTranslations } from "next-intl";

interface ScheduleViewProps {
    schedules: ScheduleDTO[];
}

export function ScheduleView({ schedules }: ScheduleViewProps) {
    const t = useTranslations("ScheduleView");

    return (
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
                    {t("download")}
                </Button>
            </Box>

            <ScheduleGrid data={schedules} />
        </Box>
    );
}
