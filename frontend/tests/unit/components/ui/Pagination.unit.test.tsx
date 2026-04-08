import { Pagination, PaginationProps } from "@/components/ui/Pagination";
import { renderWithChakraProvider } from "@test/utils";
import { screen } from "@testing-library/react";

function render(props: PaginationProps) {
    return renderWithChakraProvider(<Pagination {...props} />);
}

describe("Pagination (unit)", () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();

    it("should display the correct page info", () => {
        render({
            page: 5,
            hasMore: true,
            onPrevPage: onPrev,
            onNextPage: onNext,
        });

        expect(screen.getByText(/info/i)).toBeInTheDocument();
    });

    describe("Previous button", () => {
        it("should be disabled on the first page", () => {
            render({
                page: 1,
                hasMore: true,
                onPrevPage: onPrev,
                onNextPage: onNext,
            });

            expect(
                screen.getByRole("button", { name: /previous/i }),
            ).toBeDisabled();
        });

        it("should be enabled on pages greater than 1", () => {
            render({
                page: 2,
                hasMore: true,
                onPrevPage: onPrev,
                onNextPage: onNext,
            });

            expect(
                screen.getByRole("button", { name: /previous/i }),
            ).toBeEnabled();
        });

        it("should call onPrevPage when clicked", () => {
            render({
                page: 2,
                hasMore: true,
                onPrevPage: onPrev,
                onNextPage: onNext,
            });

            screen.getByRole("button", { name: /previous/i }).click();

            expect(onPrev).toHaveBeenCalled();
        });
    });

    describe("Next button", () => {
        it("should be disabled when hasMore is false", () => {
            render({
                page: 5,
                hasMore: false,
                onPrevPage: onPrev,
                onNextPage: onNext,
            });

            expect(
                screen.getByRole("button", { name: /next/i }),
            ).toBeDisabled();
        });

        it("should be enabled when hasMore is true", () => {
            render({
                page: 5,
                hasMore: true,
                onPrevPage: onPrev,
                onNextPage: onNext,
            });

            expect(screen.getByRole("button", { name: /next/i })).toBeEnabled();
        });

        it("should call onNextPage when clicked", () => {
            render({
                page: 5,
                hasMore: true,
                onPrevPage: onPrev,
                onNextPage: onNext,
            });

            screen.getByRole("button", { name: /next/i }).click();

            expect(onNext).toHaveBeenCalled();
        });
    });

    describe("Loading state", () => {
        it("should disable both buttons when isLoading is true", () => {
            render({
                page: 5,
                hasMore: true,
                isLoading: true,
                onPrevPage: onPrev,
                onNextPage: onNext,
            });

            expect(
                screen.getByRole("button", { name: /previous/i }),
            ).toBeDisabled();

            expect(
                screen.getByRole("button", { name: /next/i }),
            ).toBeDisabled();
        });
    });
});
