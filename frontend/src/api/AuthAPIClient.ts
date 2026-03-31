import {
    isSuccessfulLogin,
    LoginResponseBody,
    SuccessfulLoginResponse,
} from "@psb/shared/types";
import { APIClient } from "./APIClient";
import { IAuthAPIClient } from "./IAuthAPIClient";

/**
 * Provides operations for authentication-related API calls.
 */
export class AuthAPIClient extends APIClient implements IAuthAPIClient {
    protected override get baseURL(): string {
        return super.baseURL + "/auth";
    }

    async login(id: string, password: string): Promise<LoginResponseBody> {
        return this.post("/login", {
            body: JSON.stringify({ id, password }),
            headers: { "Content-Type": "application/json" },
        }).then((res) => res.json() as Promise<LoginResponseBody>);
    }

    async logout(): Promise<void> {
        await this.post("/logout");
    }

    getMe(): Promise<SuccessfulLoginResponse | null> {
        return this.get("/me")
            .then((res) => res.json() as Promise<LoginResponseBody>)
            .then((res) => (isSuccessfulLogin(res) ? res : null));
    }
}
