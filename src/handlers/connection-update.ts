import { ConnectionState, DisconnectReason } from "baileys"
import { logger } from "../utils/logger.js"
import qrcode from "qrcode"
import type { Boom } from "@hapi/boom"
import { startWhatsappConnection } from "../core/connection.js"
import { loadCommands } from "../utils/commands-loader.js"
import { MessageProvider } from "../utils/message-provider.js"

export async function connectionUpdate(update: Partial<ConnectionState>) {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
        console.log(await qrcode.toString(qr, { type: "terminal", small: true }))
    }

    if (connection == 'open') {
        console.log("Connected to Whatsapp!")
    }

    if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
        logger.error(`Connection refused: ${lastDisconnect?.error}`)

        if (shouldReconnect) {
            const commands = await loadCommands()
            const msgProvider = new MessageProvider()
            await startWhatsappConnection(commands, msgProvider)
        }
    }
}