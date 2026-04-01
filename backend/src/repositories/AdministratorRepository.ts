import { Injectable } from "@/decorators/injectable";
import { dependencyTokens } from "@/dependencies/tokens";
import { administrators, users } from "@psb/shared/schema";
import { Administrator, DrizzleDb } from "@psb/shared/types";
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
            .where(eq(users.identifier, staffId.toString()))
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
                    identifier: res.user.identifier,
                    userId: res.admin.userId,
                };
            });
    }
}
