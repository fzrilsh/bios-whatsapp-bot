import { Command } from "../types/command.type.js";
import { AllowedUsersService } from "../services/allowed-users.service.js";

const announcementCommand: Command = {
    name: "announcement",
    description: "Announce to all users",
    withPrefix: true,
    mustOwner: true,
    execute: async ({ sock, m, args }) => {
        if (!args.length) {
            return await m.reply("Format salah. Gunakan: *.announcement [message]*")
        }
        
        let successCount = 0
        const allowedUsers = new AllowedUsersService()
        const message = `🔔 *ANNOUNCEMENT*\n\n` +
            `${args.join(' ')}`
            
        for (const user of allowedUsers.users) {
            await sock.sendMessage(user, { text: message })
            successCount += 1

            await new Promise(r => setTimeout(r, 1000))
        }

        await m.reply(`✅ Pengumuman berhasil dikirim ke ${successCount} user.`)
    }
}

export default announcementCommand