import { getServerAuthApiClient } from "@/api/server";
import { SubjectAssignment } from "@/components/subjects/SubjectAssignment";
import { UserRole } from "@psb/shared/types";
import { notFound } from "next/navigation";

export default async function SubjectAssignmentPage({
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

    if (!user || user.role === UserRole.administrator) {
        notFound();
    }

    return (
        <SubjectAssignment
            assignmentId={assignmentId}
            classSubjectId={classSubjectId}
            role={user.role}
        />
    );
}
