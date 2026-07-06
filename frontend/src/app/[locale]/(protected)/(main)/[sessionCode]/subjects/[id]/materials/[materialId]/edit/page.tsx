import {
    getServerAuthApiClient,
    getServerSubjectMaterialApiClient,
} from "@/api/server";
import { ManageMaterialForm } from "@/components/subjects/ManageMaterialForm";
import { decodeSessionCode } from "@psb/shared/utils";
import { UserRole } from "@psb/shared/types";
import { notFound } from "next/navigation";

export default async function EditMaterialPage({
    params,
}: {
    params: Promise<{ sessionCode: string; id: string; materialId: string }>;
}) {
    const { sessionCode, id, materialId: materialIdParam } = await params;
    const decoded = decodeSessionCode(sessionCode);

    if (!decoded) {
        notFound();
    }

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

    if (user?.role !== UserRole.Teacher) {
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
        <ManageMaterialForm
            classSubjectId={classSubjectId}
            material={material}
        />
    );
}
