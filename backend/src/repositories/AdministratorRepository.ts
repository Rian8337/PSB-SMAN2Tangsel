import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { AdministratorSessionData, LoginResult } from "@/types";
import { administrators, users } from "@psb/shared/schema";
import { Administrator, DrizzleDb, UserRole } from "@psb/shared/types";
import { eq } from "drizzle-orm";
import { inject } from "tsyringe";
import { DatabaseRepository } from "./DatabaseRepository";
import { IAdministratorRepository } from "./IAdministratorRepository";

/**
 * Defines operations for accessing and managing administrator data in the database.
 */
@Injectable(dependencyTokens.administratorRepository)
export class AdministratorRepository
    extends DatabaseRepository
    implements IAdministratorRepository
{
    constructor(
        @inject(dependencyTokens.db)
        db: DrizzleDb,
    ) {
        super(db);
    }

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

    getLoginData(
        staffId: number,
    ): Promise<LoginResult<Administrator, AdministratorSessionData> | null> {
        return this.db
            .select({ user: users })
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
                    user: {
                        active: res.user.active,
                        id: res.user.id,
                        name: res.user.name,
                        password: res.user.password,
                        role: res.user.role,
                        userId: res.user.id,
                        staffId,
                    },
                    sessionData: {
                        role: UserRole.administrator,
                        staffId,
                        userId: res.user.id,
                    },
                } satisfies LoginResult<
                    Administrator,
                    AdministratorSessionData
                >;
            });
    }
}
