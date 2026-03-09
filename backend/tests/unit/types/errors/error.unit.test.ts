import { ForbiddenError, NotFoundError, UnauthorizedError } from "@/types";

describe("Errors (unit)", () => {
    it.each([
        [UnauthorizedError, 401],
        [ForbiddenError, 403],
        [NotFoundError, 404],
    ])("Returns the correct status code for %o: %i", (errorConstruct, code) => {
        const error = new errorConstruct();
        expect(error.statusCode).toBe(code);
    });
});
