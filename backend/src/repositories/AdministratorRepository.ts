import { Injectable } from "@/decorators/injectable";
import { DatabaseRepository } from "./DatabaseRepository";
import { IAdministratorRepository } from "./IAdministratorRepository";
import { dependencyTokens } from "@/dependencies/tokens";
import { Administrator } from "@psb/shared/types";
import { eq } from "drizzle-orm";
import { administrators, users } from "@psb/shared/schema";

/**
 * Defines operations for accessing and managing administrator data in the database.
 */
@Injectable(dependencyTokens.administratorRepository)
export class AdministratorRepository
    extends DatabaseRepository
    implements IAdministratorRepository
{
    findByStaffId(staffId: number): Promise<Administrator | null> {
        return this.db
            .select({
                user: users,
                admin: administrators,
            })
            .from(administrators)
            .innerJoin(users, eq(administrators.userId, users.id))
            .where(eq(administrators.staffId, staffId))
            .limit(1)
            .then((result) => {
                const res = result.at(0);

                if (!res) {
                    return null;
                }

                return {
                    active: res.user.active,
                    id: res.user.id,
                    name: res.user.name,
                    password: res.user.password,
                    role: res.user.role,
                    staffId: res.admin.staffId,
                    userId: res.admin.userId,
                };
            });
    }
}
