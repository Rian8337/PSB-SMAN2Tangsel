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

    getUser(id: number): Promise<UserListItem> {
        return this.get(`/${id.toString()}`).then((res) => res.json());
    }

    listUsers(
        query?: string,
        limit?: number,
        offset?: number,
    ): Promise<UserListItem[]> {
        const url = new URL(this.baseURL + "/list");

        if (typeof query === "string" && query.trim().length > 0) {
            url.searchParams.append("query", encodeURIComponent(query.trim()));
        }

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

    async updateUser(
        userId: number,
        name: string,
        active: boolean,
    ): Promise<void> {
        await this.patch(`/${userId.toString()}`, {
            body: JSON.stringify({ name, active }),
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
