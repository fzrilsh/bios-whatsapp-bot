import { connectionUpdate } from "../handlers/connection-update.js"
import { messageUpsert } from "../handlers/message-upsert.js"
import makeWASocket, { Browsers, useMultiFileAuthState, WASocket } from "baileys"
import pino from "pino"
import { Command } from "../types/command.type.js"
import { MessageProvider } from "../utils/message-provider.js"
import path from "path"

export async function startWhatsappConnection(commands: Map<string, Command>, msgProvider: MessageProvider): Promise<WASocket> {
    const { state, saveCreds } = await useMultiFileAuthState(path.join(process.cwd(), "assets/database/.baileys_auth"))

    const sock = makeWASocket({
        auth: state,
        browser: Browsers.macOS("Desktop"),
        logger: pino({ level: "silent" }),
        version: [2, 3000, 1033893291],
        keepAliveIntervalMs: 30000,
        defaultQueryTimeoutMs: undefined,
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', connectionUpdate)

    sock.ev.on('messages.upsert', chatUpdate => messageUpsert(sock, chatUpdate, commands, msgProvider))

    return sock
}

