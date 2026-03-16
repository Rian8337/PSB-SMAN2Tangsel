import { APIClient } from "./APIClient";
import { IAuthAPIClient } from "./IAuthAPIClient";

/**
 * Provides operations for authentication-related API calls.
 */
export class AuthAPIClient extends APIClient implements IAuthAPIClient {
    protected override get baseURL(): string {
        return super.baseURL + "/auth";
    }

    async login(id: string, password: string): Promise<void> {
        await this.post("/login", {
            body: JSON.stringify({ id, password }),
            headers: { "Content-Type": "application/json" },
        });
    }

    async logout(): Promise<void> {
        await this.post("/logout");
    }
}
