import { FetchResult } from "../types/fetcher.type.js"

export async function fetcher<T = any>(url: string, options?: RequestInit): Promise<FetchResult<T>> {
    try {
        const response = await fetch(url, options)

        const status = response.ok
        const status_code = response.status
        const response_text = await response.text()

        let response_json: T | null
        try {
            response_json = JSON.parse(response_text)
        } catch { 
            response_json = null
        }

        return {
            status,
            status_code,
            response,
            response_text,
            response_json
        }
    } catch (networkError) {
        const errorMessage = networkError instanceof Error ? networkError.message : String(networkError)

        return {
            status: false,
            response_text: `Network Error: ${errorMessage}`,
            response_json: null
        }
    }
}