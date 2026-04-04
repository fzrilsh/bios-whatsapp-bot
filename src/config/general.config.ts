import { GeneralConfig } from "../types/config.type.js";

export default {
    NAME: process.env.NAME ?? "Syabot",
    PREFIX: process.env.PREFIX ?? "!",
    NODE_ENV: (process.env.NODE_ENV ?? "")
} as GeneralConfig