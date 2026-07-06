import {
    getServerAuthApiClient,
    getServerSubjectDashboardApiClient,
} from "@/api/server";
import { ManageAssignmentForm } from "@/components/subjects/ManageAssignmentForm";
import { decodeSessionCode } from "@psb/shared/utils";
import { UserRole } from "@psb/shared/types";
import { notFound } from "next/navigation";

export default async function CreateAssignmentPage({
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

    if (user?.role !== UserRole.Teacher) {
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
        <ManageAssignmentForm
            classSubjectId={classSubjectId}
            subjectName={dashboard.subject.name}
            className={dashboard.class.name}
        />
    );
}
