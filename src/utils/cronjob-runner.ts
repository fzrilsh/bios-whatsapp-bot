import type { WASocket } from "baileys"
import { glob } from "glob"
import nodeCron from "node-cron"
import path from "path"
import { fileURLToPath, pathToFileURL } from "url"
import { Job } from "../types/job.js"
import { MessageProvider } from "./message-provider.js"

export const startCronJobs = async (sock: WASocket, msgProvider: MessageProvider) => {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const isProduction = __dirname.includes(`${path.sep}dist`);
    const baseDir = isProduction ? 'dist' : 'src';
    const extension = isProduction ? 'js' : 'ts';

    const pattern = path.join(process.cwd(), baseDir, "jobs", `**/*.${extension}`).replace(/\\/g, "/")
    const files = await glob(pattern)

    for (const file of files) {
        try {
            const fileUrl = pathToFileURL(file).href

            const module = await import(fileUrl)
            const job: Job = module.default

            if (job && job.name) {
                nodeCron.schedule(job.every, () => job.execute(sock, msgProvider), { timezone: "Asia/Jakarta" })
                console.log(`Successfully run job: ${job.name}`)
            }
        } catch (error) {
            throw error
        }
    }
}