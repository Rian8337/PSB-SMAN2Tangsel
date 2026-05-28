import { getServerAuthApiClient } from "@/api/server";
import { StudentSubmissionList } from "@/components/subjects/StudentSubmissionList";
import { UserRole } from "@psb/shared/types";
import { notFound } from "next/navigation";

export default async function StudentSubmissionsPage({
    params,
}: {
    params: Promise<{ id: string; assignmentId: string }>;
}) {
    const { id, assignmentId: assignmentIdParam } = await params;

    const classSubjectId = parseInt(id, 10);
    const assignmentId = parseInt(assignmentIdParam, 10);

    if (
        isNaN(classSubjectId) ||
        classSubjectId <= 0 ||
        isNaN(assignmentId) ||
        assignmentId <= 0
    ) {
        notFound();
    }

    const authApiClient = await getServerAuthApiClient();
    const user = await authApiClient.getMe();

    if (user?.role !== UserRole.teacher) {
        notFound();
    }

    return (
        <StudentSubmissionList
            assignmentId={assignmentId}
            classSubjectId={classSubjectId}
        />
    );
}
