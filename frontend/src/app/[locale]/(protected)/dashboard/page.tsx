import {
    getServerAuthApiClient,
    getServerScheduleApiClient,
} from "@/api/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { ScheduleGrid } from "@/components/schedule/ScheduleGrid";
import { Box, Button } from "@chakra-ui/react";
import { ScheduleDTO } from "@psb/shared/types";

export default async function DashboardPage() {
    const authApiClient = await getServerAuthApiClient();
    const scheduleApiClient = await getServerScheduleApiClient();

    const [user, schedule] = await Promise.all([
        authApiClient.getMe().catch(() => null),
        scheduleApiClient.getSchedule().catch(() => [] as ScheduleDTO[]),
    ]);

    const firstName = user?.name.split(" ")[0] ?? "Student";

    return (
        <>
            <PageHeader title={`Welcome back, ${firstName}!`} />

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
                        Download
                    </Button>
                </Box>

                <ScheduleGrid data={schedule} />
            </Box>
        </>
    );
}
