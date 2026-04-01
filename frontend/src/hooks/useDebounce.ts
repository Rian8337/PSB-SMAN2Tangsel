import { useEffect, useState } from "react";

/**
 * Delays the state update of a value until a specified delay has passed without any updates.
 *
 * @param value The value to be debounced.
 * @param delay The delay in milliseconds to wait before updating the debounced value after the last change.
 * @returns The debounced value that only updates after the specified delay has passed without any changes to the input value.
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}
