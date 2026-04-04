import config from "../config/index.js";
import { UserData } from "../types/binusmaya.type.js";
import { fetcher } from "../utils/fetcher.js"

export class AuthService {
    private id: string

    constructor(id: string) {
        this.id = id
    }

    public async getUserInfo(): Promise<UserData | null> {
        const { status, response_json } = await fetcher(`${config.API_BASE_URL}/auth/user`, {
            headers: {
                Authorization: process.env.API_PRIVATE_KEY,
                userId: this.id
            }
        })

        return status ? response_json.data as UserData : null
    }

    public async login(email: string, password: string) {
        const { status_code } = await fetcher(`${config.API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                Authorization: process.env.API_PRIVATE_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: this.id,
                email,
                password
            })
        })

        return status_code
    }

    public async logout() {
        const { status_code } = await fetcher(`${config.API_BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                Authorization: process.env.API_PRIVATE_KEY,
                userId: this.id
            }
        })

        return status_code
    }
}