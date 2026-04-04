import { ApiConfig } from "../types/config.type.js";

export default {
    API_BASE_URL: (process.env.API_BASE_URL ?? "")
} as ApiConfig