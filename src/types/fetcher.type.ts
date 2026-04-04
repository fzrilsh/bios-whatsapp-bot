export interface FetchResult<T = any> {
    status: boolean
    status_code?: number
    response?: Response,
    response_text: string
    response_json: T | null,
}