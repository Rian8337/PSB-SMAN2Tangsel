import {
    getServerAuthApiClient,
    getServerScheduleApiClient,
} from "@/api/server";
import { DashboardClientView } from "@/components/dashboard/DashboardClientView";
import { ScheduleDTO } from "@psb/shared/types";

export default async function DashboardPage() {
    const authApiClient = await getServerAuthApiClient();
    const scheduleApiClient = await getServerScheduleApiClient();

    const [user, schedules] = await Promise.all([
        authApiClient.getMe().catch(() => null),
        scheduleApiClient.getSchedule().catch(() => [] as ScheduleDTO[]),
    ]);

    const firstName = user?.name.split(" ")[0] ?? "Student";

    return <DashboardClientView name={firstName} schedules={schedules} />;
}
