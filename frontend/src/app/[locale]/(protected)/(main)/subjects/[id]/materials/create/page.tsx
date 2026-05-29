import { getServerAuthApiClient } from "@/api/server";
import { ManageMaterialForm } from "@/components/subjects/ManageMaterialForm";
import { SubjectMaterialApiProvider } from "@/providers/api/subject-material-api-provider";
import { UserRole } from "@psb/shared/types";
import { notFound } from "next/navigation";

export default async function CreateMaterialPage({
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

    return (
        <SubjectMaterialApiProvider>
            <ManageMaterialForm classSubjectId={classSubjectId} />
        </SubjectMaterialApiProvider>
    );
}
