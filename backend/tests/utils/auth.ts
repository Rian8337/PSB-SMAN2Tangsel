import { seededPrimaryData } from "@psb/shared/tests";
import TestAgent from "supertest/lib/agent";

const loginEndpoint = "/auth/login";
const testPassword = "password123";

/**
 * Logins a test agent as a student.
 *
 * This uses the first student from {@link seededPrimaryData.students} to perform the login.
 *
 * @param agent The test agent to login.
 * @returns The response from the login endpoint.
 */
export function loginStudent(agent: TestAgent) {
    const student = seededPrimaryData.students[0];

    return agent.post(loginEndpoint).send({
        id: student.nisn,
        password: testPassword,
    });
}

/**
 * Logins a test agent as a teacher.
 *
 * This uses the first teacher from {@link seededPrimaryData.teachers} to perform the login.
 *
 * @param agent The test agent to login.
 * @returns The response from the login endpoint.
 */
export function loginTeacher(agent: TestAgent) {
    const teacher = seededPrimaryData.teachers[0];

    return agent.post(loginEndpoint).send({
        id: teacher.staffId.toString(),
        password: testPassword,
    });
}

/**
 * Logins a test agent as an administrator.
 *
 * This uses the first administrator from {@link seededPrimaryData.administrators} to perform the login.
 *
 * @param agent The test agent to login.
 * @returns The response from the login endpoint.
 */
export function loginAdministrator(agent: TestAgent) {
    const admin = seededPrimaryData.administrators[0];

    return agent.post(loginEndpoint).send({
        id: admin.staffId.toString(),
        password: testPassword,
    });
}
