import { proto, WASocket } from "baileys";
import { Command } from "../types/command.type.js";
import { logger } from "../utils/logger.js";
import { smgs } from "../core/serialize.js";
import config from "../config/index.js";
import { reactionMessage } from "./reaction-message.js";
import { AllowedUsersService } from "../services/allowed-users.service.js";
import { MessageProvider } from "../utils/message-provider.js";
import { JSONDB } from "../database/json-db.js";


export async function messageUpsert(sock: WASocket, chatUpdate: { messages: proto.IWebMessageInfo[] }, commands: Map<string, Command>, msgProvider: MessageProvider) {
    const maintenance = new JSONDB("assets/database/maintenance.json", {})
    const messagesWhenMaintenance = new JSONDB("assets/database/messages-when-maintenance.json", {})
    const allowedUsers = new AllowedUsersService()

    for (const msg of chatUpdate.messages) {
        const m = smgs(sock, msg)

        try {
            const msgTimestamp = (msg.messageTimestamp as number) || Math.floor(Date.now() / 1000)
            const currentTimestamp = Math.floor(Date.now() / 1000)

            if (currentTimestamp - msgTimestamp > 60 * 60 * 24) {
                continue
            }

            if (m.message?.reactionMessage) {
                await reactionMessage(m, allowedUsers, sock, commands, msgProvider)
                continue
            }

            if (!m || !m.text || m.isGroup) {
                continue
            }

            const prefix = config.PREFIX
            if (!m.text.startsWith(prefix) && !m.isOwner) {
                continue
            }

            for (const cmd of commands.values()) {
                const args = m.text.slice(cmd.withPrefix ? prefix.length : 0).trim().split(/ +/)
                const commandName = args.shift()?.toLowerCase()

                if (commandName == cmd.name || cmd.alias?.includes(commandName!)) {
                    await m.read()

                    const isAllowed = await allowedUsers.handleUserNotAllowed(sock, m)
                    if (!isAllowed) return
                    
                    if (maintenance.get.mode && !m.fromMe && !m.isOwner) {
                        messagesWhenMaintenance.get[m.sender] = msg
                        messagesWhenMaintenance.write()
                        return await m.reply('Mohon maaf, saat ini sistem tidak dapat digunakan. Perintah terakhir kamu akan sistem response setelah maintenance selesai.\n\n> Note: ' + maintenance.get.reason)
                    }

                    if (cmd.mustOwner && !m.isOwner) {
                        return await m.reply(msgProvider.get('forbidden')!)
                    }

                    await cmd.execute({ sock, m, args, commands, command: commandName!, msgProvider })
                    break
                }
            }
        } catch (error) {
            logger.error("CRITICAL_HANDLER_ERROR", error)
            await m.reply("⚠️ Maaf, sistem sedang sibuk/error.")
        }
    }
}