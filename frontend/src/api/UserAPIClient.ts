import { UserListItem, UserRole } from "@psb/shared/types";
import { APIClient } from "./APIClient";
import { IUserAPIClient } from "./IUserAPIClient";

/**
 * Provides operations for user-related API calls.
 */
export class UserAPIClient extends APIClient implements IUserAPIClient {
    protected override get baseURL(): string {
        return super.baseURL + "/users";
    }

    listUsers(limit?: number, offset?: number): Promise<UserListItem[]> {
        const url = new URL(this.baseURL + "/list");

        if (limit !== undefined) {
            url.searchParams.append("limit", limit.toString());
        }

        if (offset !== undefined) {
            url.searchParams.append("offset", offset.toString());
        }

        return this.get(url).then((res) => res.json());
    }

    async createUser(
        name: string,
        password: string,
        role: UserRole,
        identifier: string,
    ): Promise<void> {
        await this.post("/create", {
            body: JSON.stringify({ name, password, role, identifier }),
            headers: { "Content-Type": "application/json" },
        });
    }

    async updateActiveState(userId: number, active: boolean): Promise<void> {
        await this.patch("/update-active-state", {
            body: JSON.stringify({ userId, active }),
            headers: { "Content-Type": "application/json" },
        });
    }

    async updatePassword(
        currentPassword: string,
        newPassword: string,
    ): Promise<void> {
        await this.patch("/update-password", {
            body: JSON.stringify({ currentPassword, newPassword }),
            headers: { "Content-Type": "application/json" },
        });
    }

    async deleteUser(userId: number): Promise<void> {
        await this.delete(`/${userId.toString()}`);
    }
}
