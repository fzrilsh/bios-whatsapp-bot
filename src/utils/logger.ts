import fs from "fs";
import path from "path";
import { LogData } from "../types/logger.type.js";

class ErrorLogger {
    private logPath = path.join(process.cwd(), "logs/error.log")
    
    private runtimeLogs: LogData[] = []
    private readonly MAX_RUNTIME_LOGS = 100

    constructor() {
        if (!fs.existsSync(path.dirname(this.logPath))) {
            fs.mkdirSync(path.dirname(this.logPath), { recursive: true })
        }
    }

    public error(context: string, message: any = {}) {
        const timestamp = new Date().toISOString()
        const msgStr = message instanceof Error ? message.stack || message.message : JSON.stringify(message)
        
        const logEntry: LogData = {
            timestamp,
            context: context.toUpperCase(),
            message: msgStr
        }

        this.runtimeLogs.push(logEntry)
        if (this.runtimeLogs.length > this.MAX_RUNTIME_LOGS) {
            this.runtimeLogs.shift()
        }

        const fileEntry = `[${timestamp}] [${logEntry.context}]: ${msgStr}\n`
        console.error(`\x1b[31m${fileEntry}\x1b[0m`)
        fs.appendFileSync(this.logPath, fileEntry)
    }

    public getRuntimeLogs(limit: number = 20): LogData[] {
        return this.runtimeLogs.slice(-limit).reverse()
    }

    public clearRuntimeLogs() {
        this.runtimeLogs = []
    }
}

export const logger = new ErrorLogger()