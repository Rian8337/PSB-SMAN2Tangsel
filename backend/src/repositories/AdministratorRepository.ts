import { Injectable } from "@/decorators/injectable";
import { DatabaseRepository } from "./DatabaseRepository";
import { IAdministratorRepository } from "./IAdministratorRepository";
import { dependencyTokens } from "@/dependencies/tokens";
import { Administrator } from "@psb/shared/types";
import { eq } from "drizzle-orm";
import { administrators } from "@psb/shared/schema";

/**
 * Defines operations for accessing and managing administrator data in the database.
 */
@Injectable(dependencyTokens.administratorRepository)
export class AdministratorRepository
    extends DatabaseRepository
    implements IAdministratorRepository
{
    findByStaffId(staffId: number): Promise<Administrator | null> {
        return this.db.query.administrators
            .findFirst({
                with: {
                    user: true,
                },
                where: eq(administrators.staffId, staffId),
            })
            .then((res) => {
                if (!res) {
                    return null;
                }

                return {
                    active: res.user.active,
                    id: res.user.id,
                    name: res.user.name,
                    password: res.user.password,
                    role: res.user.role,
                    staffId: res.staffId,
                    userId: res.userId,
                };
            });
    }
}
