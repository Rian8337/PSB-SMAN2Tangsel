/**
 * Base response body for all API endpoints.
 */
export interface ApiErrorBody {
    /**
     * The error message describing what went wrong with the API request.
     */
    readonly error: string;
}
