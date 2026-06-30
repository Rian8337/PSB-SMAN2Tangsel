import {
    getServerAuthApiClient,
    getServerSubjectDashboardApiClient,
} from "@/api/server";
import { ManageMaterialForm } from "@/components/subjects/ManageMaterialForm";
import { decodeSessionCode } from "@/utils/sessionCode";
import { UserRole } from "@psb/shared/types";
import { notFound } from "next/navigation";

export default async function CreateMaterialPage({
    params,
}: {
    params: Promise<{ sessionCode: string; id: string }>;
}) {
    const { sessionCode, id } = await params;
    const decoded = decodeSessionCode(sessionCode);

    if (!decoded) {
        notFound();
    }

    const classSubjectId = parseInt(id, 10);

    if (isNaN(classSubjectId) || classSubjectId <= 0) {
        notFound();
    }

    const authApiClient = await getServerAuthApiClient();
    const user = await authApiClient.getMe();

    if (user?.role !== UserRole.teacher) {
        notFound();
    }

    const dashboardApiClient = await getServerSubjectDashboardApiClient();
    const dashboard = await dashboardApiClient
        .getDashboard(classSubjectId)
        .catch(() => null);

    if (!dashboard) {
        notFound();
    }

    return (
        <ManageMaterialForm
            classSubjectId={classSubjectId}
            subjectName={dashboard.subject.name}
            className={dashboard.class.name}
        />
    );
}
