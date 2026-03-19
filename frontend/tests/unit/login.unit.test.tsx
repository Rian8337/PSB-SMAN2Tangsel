import LoginPage from "@/app/[locale]/login/page";
import { AuthApiProvider } from "@/providers/api/auth-api-provider";
import { mockAuthApiClient, mockRouter } from "@test/mocks";
import { renderWithChakraProvider } from "@test/utils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

function renderPage() {
    return renderWithChakraProvider(
        <AuthApiProvider client={mockAuthApiClient}>
            <LoginPage />
        </AuthApiProvider>,
    );
}

describe("LoginPage", () => {
    it("renders the form fields", () => {
        renderPage();

        expect(screen.getByText("title")).toBeInTheDocument();
        expect(screen.getByLabelText("id")).toBeInTheDocument();
        expect(screen.getByLabelText("password")).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "login" }),
        ).toBeInTheDocument();
    });

    it("sends credentials to the API on submit", async () => {
        mockAuthApiClient.login.mockResolvedValueOnce(undefined);

        renderPage();

        await userEvent.type(screen.getByLabelText("id"), "1234567890");
        await userEvent.type(screen.getByLabelText("password"), "secret");
        await userEvent.click(screen.getByRole("button", { name: "login" }));

        await waitFor(() => {
            expect(mockAuthApiClient.login).toHaveBeenCalledWith(
                "1234567890",
                "secret",
            );

            expect(mockRouter.push).toHaveBeenCalledWith("/dashboard");
        });
    });

    it("shows an error on failed login", async () => {
        mockAuthApiClient.login.mockRejectedValueOnce(
            new Error("Invalid credentials."),
        );

        renderPage();

        await userEvent.type(screen.getByLabelText("id"), "bad");
        await userEvent.type(screen.getByLabelText("password"), "bad");
        await userEvent.click(screen.getByRole("button", { name: "login" }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Invalid credentials.",
        );

        expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it("shows a generic error on network failure", async () => {
        mockAuthApiClient.login.mockRejectedValueOnce("Something went wrong!");

        renderPage();

        await userEvent.type(screen.getByLabelText("id"), "test");
        await userEvent.type(screen.getByLabelText("password"), "test");
        await userEvent.click(screen.getByRole("button", { name: "login" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("error");
    });
});
