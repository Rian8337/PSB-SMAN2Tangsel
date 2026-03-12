import { i18nMiddleware, Locale, messages } from "@/i18n";
import { createMockRequestFactory, createMockResponse } from "@test/mocks";

describe("i18nMiddleware (unit)", () => {
    const mockRequestFactory = createMockRequestFactory();

    function setupMiddleware(matchedLanguage: Locale | false) {
        const req = mockRequestFactory({
            acceptsLanguages: vi.fn().mockReturnValue(matchedLanguage),
        });

        const res = createMockResponse();
        const next = vi.fn();

        i18nMiddleware(req, res, next);

        return { req, res, next };
    }

    it("Defaults to Indonesian ('id') when no supported language is provided", () => {
        const { req, next } = setupMiddleware(false);

        expect(req.locale).toBe("id");
        expect(next).toHaveBeenCalledOnce();
        expect(req.t("http.notFound")).toBe(messages.id.http.notFound);
    });

    it("Sets locale to English ('en') when requested", () => {
        const { req, next } = setupMiddleware("en");

        expect(req.locale).toBe("en");
        expect(next).toHaveBeenCalledOnce();

        expect(req.t("http.notFound")).toBe(messages.en.http.notFound);
    });

    it("Correctly resolves dot notation paths", () => {
        const { req } = setupMiddleware("id");

        expect(req.t("auth.invalidCredentials")).toBe(
            messages.id.auth.invalidCredentials,
        );

        expect(req.t("http.serverError")).toBe(messages.id.http.serverError);
    });
});
