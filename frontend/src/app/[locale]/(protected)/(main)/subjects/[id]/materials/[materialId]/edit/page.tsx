import {
    getServerAuthApiClient,
    getServerSubjectMaterialApiClient,
} from "@/api/server";
import { ManageMaterialForm } from "@/components/subjects/ManageMaterialForm";
import { SubjectMaterialApiProvider } from "@/providers/api/subject-material-api-provider";
import { UserRole } from "@psb/shared/types";
import { notFound } from "next/navigation";

export default async function EditMaterialPage({
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

    if (user?.role !== UserRole.teacher) {
        notFound();
    }

    const materialApiClient = await getServerSubjectMaterialApiClient();

    const material = await materialApiClient
        .getMaterial(materialId)
        .catch(() => null);

    if (!material) {
        notFound();
    }

    return (
        <SubjectMaterialApiProvider>
            <ManageMaterialForm
                classSubjectId={classSubjectId}
                material={material}
            />
        </SubjectMaterialApiProvider>
    );
}
