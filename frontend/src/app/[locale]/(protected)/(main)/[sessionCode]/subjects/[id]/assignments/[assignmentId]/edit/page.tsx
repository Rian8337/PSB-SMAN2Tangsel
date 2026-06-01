import {
    getServerAuthApiClient,
    getServerSubjectAssignmentApiClient,
} from "@/api/server";
import { ManageAssignmentForm } from "@/components/subjects/ManageAssignmentForm";
import { decodeSessionCode } from "@/utils/sessionCode";
import { UserRole } from "@psb/shared/types";
import { notFound } from "next/navigation";

export default async function EditAssignmentPage({
    params,
}: {
    params: Promise<{ sessionCode: string; id: string; assignmentId: string }>;
}) {
    const { sessionCode, id, assignmentId: assignmentIdParam } = await params;

    const decoded = decodeSessionCode(sessionCode);
    if (!decoded) notFound();

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

    const assignmentApiClient = await getServerSubjectAssignmentApiClient();
    const assignment = await assignmentApiClient
        .getAssignment(assignmentId)
        .then((a) => ("visible" in a ? a : null))
        .catch(() => null);

    if (!assignment) {
        notFound();
    }

    return (
        <ManageAssignmentForm
            classSubjectId={classSubjectId}
            assignment={assignment}
        />
    );
}
