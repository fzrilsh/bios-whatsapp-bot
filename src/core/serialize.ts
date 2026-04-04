import { jidNormalizedUser, type proto, type WAMessage, type WAMessageKey, type WASocket } from "baileys"
import { ExtendedMessage } from "../types/extended-message.type.js"
import config from "../config/index.js"
import { AuthService } from "../services/auth.service.js"

export const smgs = (sock: WASocket, m: proto.IWebMessageInfo) => {
    const msg = m as ExtendedMessage
    if (!msg.message) return msg

    msg.id = m.key?.id!
    msg.chat = jidNormalizedUser(m.key?.remoteJid!)
    msg.fromMe = m.key?.fromMe!
    msg.isGroup = msg.chat.endsWith("@g.us")
    msg.sender = jidNormalizedUser((msg.key as any)?.addressingMode == 'pn' ? msg.key?.remoteJid : (msg.key as any)?.remoteJidAlt)
    msg.auth = new AuthService(msg.sender)
    msg.isOwner = config.OWNER_NUMBER === msg.sender.split("@")[0]
    msg.text = msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        msg.message?.videoMessage?.caption || ""

    msg.reply = async (text: string, quote?: boolean, options?: object) => {
        return await sock.sendMessage(m.key?.remoteJid!, { text: text, ...options }, quote ? { quoted: m as WAMessage } : {})
    }

    msg.read = async () => {
        return await sock.readMessages([m.key as WAMessageKey]);
    }

    msg.react = async (emoji: string) => {
        return await sock.sendMessage(m.key?.remoteJid!, {
            react: { text: emoji, key: m.key } as proto.Message.IReactionMessage
        })
    }

    return msg
}