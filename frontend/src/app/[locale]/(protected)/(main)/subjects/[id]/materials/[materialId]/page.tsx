import { getServerAuthApiClient } from "@/api/server";
import { SubjectMaterial } from "@/components/subjects/SubjectMaterial";
import { UserRole } from "@psb/shared/types";
import { notFound } from "next/navigation";

export default async function SubjectMaterialPage({
    params,
}: {
    params: Promise<{ id: string; materialId: string }>;
}) {
    const { id, materialId: materialIdParam } = await params;

    const classSubjectId = parseInt(id, 10);
    const materialId = parseInt(materialIdParam, 10);

    if (
        isNaN(classSubjectId) ||
        classSubjectId <= 0 ||
        isNaN(materialId) ||
        materialId <= 0
    ) {
        notFound();
    }

    const authApiClient = await getServerAuthApiClient();
    const user = await authApiClient.getMe();

    if (!user || user.role === UserRole.administrator) {
        notFound();
    }

    return (
        <SubjectMaterial
            materialId={materialId}
            classSubjectId={classSubjectId}
            role={user.role}
        />
    );
}
