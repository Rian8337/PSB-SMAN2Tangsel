import {
    getServerAuthApiClient,
    getServerSubjectDashboardApiClient,
} from "@/api/server";
import { ManageAssignmentForm } from "@/components/subjects/ManageAssignmentForm";
import { SubjectAssignmentApiProvider } from "@/providers/api/subject-assignment-api-provider";
import { UserRole } from "@psb/shared/types";
import { notFound } from "next/navigation";

export default async function CreateAssignmentPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
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
        <SubjectAssignmentApiProvider>
            <ManageAssignmentForm
                classSubjectId={classSubjectId}
                subjectName={dashboard.subject.name}
                className={dashboard.class.name}
            />
        </SubjectAssignmentApiProvider>
    );
}
