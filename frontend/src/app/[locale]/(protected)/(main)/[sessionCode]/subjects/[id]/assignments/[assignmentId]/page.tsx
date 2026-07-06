import { getServerAuthApiClient } from "@/api/server";
import { SubjectAssignment } from "@/components/subjects/SubjectAssignment";
import { decodeSessionCode } from "@psb/shared/utils";
import { UserRole } from "@psb/shared/types";
import { notFound } from "next/navigation";

export default async function SubjectAssignmentPage({
    params,
}: {
    params: Promise<{ sessionCode: string; id: string; assignmentId: string }>;
}) {
    const { sessionCode, id, assignmentId: assignmentIdParam } = await params;
    const decoded = decodeSessionCode(sessionCode);

    if (!decoded) {
        notFound();
    }

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

    if (!user || user.role === UserRole.Administrator) {
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
