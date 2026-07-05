import { seededPrimaryData, testPassword } from "@psb/shared/tests";
import { UserRole } from "@psb/shared/types";
import TestAgent from "supertest/lib/agent";

const loginEndpoint = "/auth/login";

/**
 * Logins a test agent as a student.
 *
 * This uses the first student from {@link seededPrimaryData.users} to perform the login.
 *
 * @param agent The test agent to login.
 * @returns The response from the login endpoint.
 */
export function loginStudent(agent: TestAgent) {
    return loginUser(agent, UserRole.Student);
}

/**
 * Logins a test agent as a teacher.
 *
 * This uses the first teacher from {@link seededPrimaryData.users} to perform the login.
 *
 * @param agent The test agent to login.
 * @returns The response from the login endpoint.
 */
export function loginTeacher(agent: TestAgent) {
    return loginUser(agent, UserRole.Teacher);
}

/**
 * Logins a test agent as an administrator.
 *
 * This uses the first administrator from {@link seededPrimaryData.users} to perform the login.
 *
 * @param agent The test agent to login.
 * @returns The response from the login endpoint.
 */
export function loginAdministrator(agent: TestAgent) {
    return loginUser(agent, UserRole.Administrator);
}

async function loginUser(agent: TestAgent, role: UserRole) {
    const user = seededPrimaryData.users.find((u) => u.role === role);

    if (!user) {
        throw new Error(`No user found with role ${role.toString()}`);
    }

    const res = await agent.post(loginEndpoint).send({
        id: user.identifier,
        password: testPassword,
    });

    if (res.status !== 200) {
        throw new Error(
            `Login failed for user with role ${role.toString()} with status ${res.status.toString()}`,
        );
    }

    return res;
}

/**
 * Logins a test agent using explicit credentials. This can be used to log in as temporary test users.
 *
 * @param agent The test agent to login.
 * @param identifier The user's identifier.
 * @param password The raw password. Defaults to {@link testPassword}.
 */
export async function loginWithCredentials(
    agent: TestAgent,
    identifier: string,
    password = testPassword,
) {
    const res = await agent.post(loginEndpoint).send({
        id: identifier,
        password: password,
    });

    if (res.status !== 200) {
        throw new Error(
            `Login failed for user ${identifier} with status ${res.status.toString()}`,
        );
    }

    return res;
}
