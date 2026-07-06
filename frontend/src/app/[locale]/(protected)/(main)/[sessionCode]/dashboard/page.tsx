import { getServerAuthApiClient } from "@/api/server";
import { DashboardClientView } from "@/components/dashboard/DashboardClientView";
import { UserRole } from "@psb/shared/types";
import { decodeSessionCode } from "@psb/shared/utils";
import { notFound } from "next/navigation";

export default async function SessionDashboardPage({
    params,
}: {
    params: Promise<{ sessionCode: string }>;
}) {
    const { sessionCode } = await params;

    const decoded = decodeSessionCode(sessionCode);

    if (!decoded) {
        notFound();
    }

    const authApiClient = await getServerAuthApiClient();
    const user = await authApiClient.getMe();

    if (!user || user.role === UserRole.Administrator) {
        notFound();
    }

    return (
        <DashboardClientView
            name={user.name.split(" ")[0]}
            role={user.role}
            activeSessionCode={sessionCode}
        />
    );
}
