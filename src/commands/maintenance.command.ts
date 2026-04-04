import { Command } from "../types/command.type.js";
import { JSONDB } from "../database/json-db.js";
import { messageUpsert } from "../handlers/message-upsert.js";

const maintenance = new JSONDB("assets/database/maintenance.json", {})
const messagesWhenMaintenance = new JSONDB("assets/database/messages-when-maintenance.json", {})

const maintenanceCommand: Command = {
    name: "maintenance",
    description: "Set maintenance mode",
    withPrefix: true,
    mustOwner: true,
    execute: async ({ sock, m, args, commands, msgProvider }) => {
        if (args.length < 1) {
            return await m.reply("Format salah. Gunakan: *.maintenance [mode] [reason]*")
        }

        const mode = args.shift() == 'true' ? true : false
        const reason = args.join(' ')

        maintenance.get.mode = mode
        maintenance.get.reason = reason
        maintenance.write()

        if (!mode) {
            messageUpsert(sock, { messages: Object.values(messagesWhenMaintenance.get) }, commands, msgProvider)
            messagesWhenMaintenance.clear()
            messagesWhenMaintenance.write()
        }

        await m.reply(`Maintenance mode berhasil di ganti!\nMode: ${mode}\nReason: ${reason}`)
    }
}

export default maintenanceCommand