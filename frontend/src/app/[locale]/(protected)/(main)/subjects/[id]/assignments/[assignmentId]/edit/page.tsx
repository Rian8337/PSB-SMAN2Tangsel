import {
    getServerAuthApiClient,
    getServerSubjectAssignmentApiClient,
} from "@/api/server";
import { ManageAssignmentForm } from "@/components/subjects/ManageAssignmentForm";
import { SubjectAssignmentApiProvider } from "@/providers/api/subject-assignment-api-provider";
import { UserRole } from "@psb/shared/types";
import { notFound } from "next/navigation";

export default async function EditAssignmentPage({
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

    const assignmentApiClient = await getServerSubjectAssignmentApiClient();

    const assignment = await assignmentApiClient
        .getAssignment(assignmentId)
        .then((a) => ("visible" in a ? a : null))
        .catch(() => null);

    if (!assignment) {
        notFound();
    }

    return (
        <SubjectAssignmentApiProvider>
            <ManageAssignmentForm
                classSubjectId={classSubjectId}
                assignment={assignment}
            />
        </SubjectAssignmentApiProvider>
    );
}
