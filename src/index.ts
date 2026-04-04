import { startWhatsappConnection } from "./core/connection.js";
import { loadCommands } from "./utils/commands-loader.js";
import { startCronJobs } from "./utils/cronjob-runner.js";
import { logger } from "./utils/logger.js";
import { MessageProvider } from "./utils/message-provider.js";

process.on("uncaughtException", (err) => {
    logger.error("Uncaught Exception:", err)
})

process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled Rejection:", reason)
})

async function bootstrap() {
    console.log("Starting BIOS WhatsApp Service...")

    const commands = await loadCommands()
    const msgProvider = new MessageProvider()

    const sock = await startWhatsappConnection(commands, msgProvider)

    await startCronJobs(sock, msgProvider)
    // const notificationManager = new NotificationManager(sock)
    // await notificationManager.init()
}

bootstrap()