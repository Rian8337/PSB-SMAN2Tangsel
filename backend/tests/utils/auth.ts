import { seededPrimaryData } from "@psb/shared/tests";
import { UserRole } from "@psb/shared/types";
import TestAgent from "supertest/lib/agent";

const loginEndpoint = "/auth/login";
const testPassword = "password123";

/**
 * Logins a test agent as a student.
 *
 * This uses the first student from {@link seededPrimaryData.users} to perform the login.
 *
 * @param agent The test agent to login.
 * @returns The response from the login endpoint.
 */
export function loginStudent(agent: TestAgent) {
    return loginUser(agent, UserRole.student);
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
    return loginUser(agent, UserRole.teacher);
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
    return loginUser(agent, UserRole.administrator);
}

function loginUser(agent: TestAgent, role: UserRole) {
    const user = seededPrimaryData.users.find((u) => u.role === role);

    if (!user) {
        throw new Error(`No user found with role ${role.toString()}`);
    }

    return agent.post(loginEndpoint).send({
        id: user.identifier,
        password: testPassword,
    });
}
