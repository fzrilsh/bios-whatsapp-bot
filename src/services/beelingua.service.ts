import config from "../config/index.js"
import { fetcher } from "../utils/fetcher.js"
import { logger } from "../utils/logger.js"

export class BeelinguaService {
    constructor(private id: string) { }

    private get headers() {
        return {
            Authorization: process.env.API_PRIVATE_KEY,
            'Content-Type': 'application/json',
            userId: this.id
        }
    }

    public async getProfile() {
        const { status, response_text, response_json } = await fetcher(`${config.API_BASE_URL}/beelingua/profile`, {
            headers: this.headers
        })

        if (!status) {
            logger.error("Failed to fetch Beelingua profile", response_text)
            throw new Error(response_text)
        }

        return response_json.data
    }

    public async getJourneys() {
        const { status, response_text, response_json } = await fetcher(`${config.API_BASE_URL}/beelingua/journeys`, {
            headers: this.headers
        })

        if (!status) {
            logger.error("Failed to fetch journeys", response_text)
            throw new Error(response_text)
        }

        return response_json.data
    }

    public async getCourses(journeyId: string) {
        const { status, response_text, response_json } = await fetcher(`${config.API_BASE_URL}/beelingua/courses?journeyId=${journeyId}`, {
            headers: this.headers
        })

        if (!status) {
            logger.error(`Failed to fetch courses for journey ${journeyId}`, response_text)
            throw new Error(response_text)
        }

        return response_json.data
    }

    public async pollProgress(classId: string) {
        const { status, response_text, response_json } = await fetcher(`${config.API_BASE_URL}/beelingua/polling?classId=${classId}`, {
            headers: this.headers
        })

        if (!status) {
            logger.error(`Failed to poll progress for class ${classId}`, response_text)
            throw new Error(response_text)
        }

        return response_json.data
    }

    public async solveCourse(classId: string): Promise<boolean> {
        const { status, response_text } = await fetcher(`${config.API_BASE_URL}/beelingua/solve`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({ classId }),
            keepalive: true
        })

        if (!status) {
            logger.error(`Failed to start course solver for ${classId}`, response_text)
            return false
        }

        return true
    }

    public async getAdminReport() {
        const { status, response_text, response_json } = await fetcher(`${config.API_BASE_URL}/beelingua/admin/report`, {
            headers: this.headers
        })

        if (!status) {
            logger.error("Failed to fetch admin report", response_text)
            throw new Error(response_text)
        }

        return response_json.data
    }

    public async addTokenAdmin(targetJid: string, amount: number) {
        const { status, response_text, response_json } = await fetcher(`${config.API_BASE_URL}/beelingua/admin/tokens/add`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({ targetJid, amount })
        })

        if (!status) {
            logger.error(`Failed to add token to ${targetJid}`, response_text)
            throw new Error(response_text)
        }

        return response_json.data
    }

    public async removeTokenAdmin(targetJid: string, amount: number) {
        const { status, response_text, response_json } = await fetcher(`${config.API_BASE_URL}/beelingua/admin/tokens/remove`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({ targetJid, amount })
        })

        if (!status) {
            logger.error(`Failed to remove token from ${targetJid}`, response_text)
            throw new Error(response_text)
        }

        return response_json.data
    }
}