import { getServerAuthApiClient, getServerScheduleApiClient } from "@/api/server";
import { MySchedule } from "@/components/schedule/MySchedule";
import { MySubjects } from "@/components/subjects/MySubjects";
import { ScheduleApiProvider } from "@/providers/api/schedule-api-provider";
import { SubjectApiProvider } from "@/providers/api/subject-api-provider";
import { decodeSessionCode } from "@/utils/sessionCode";
import { UserRole } from "@psb/shared/types";
import { notFound } from "next/navigation";

export default async function SessionDashboardPage({
    params,
}: {
    params: Promise<{ sessionCode: string }>;
}) {
    const { sessionCode } = await params;

    const decoded = decodeSessionCode(sessionCode);
    if (!decoded) notFound();

    const authApiClient = await getServerAuthApiClient();
    const user = await authApiClient.getMe();

    if (!user || user.role === UserRole.administrator) {
        notFound();
    }

    const scheduleApiClient = await getServerScheduleApiClient();
    const schedules = await scheduleApiClient
        .getSchedule(decoded.session, decoded.semester)
        .catch(() => []);

    return (
        <>
            <SubjectApiProvider>
                <MySubjects
                    session={decoded.session}
                    semester={decoded.semester}
                />
            </SubjectApiProvider>

            <ScheduleApiProvider>
                <MySchedule schedules={schedules} showHeader={false} />
            </ScheduleApiProvider>
        </>
    );
}
