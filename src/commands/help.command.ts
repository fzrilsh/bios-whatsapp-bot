import { Command } from "../types/command.type.js"

const helpCommand: Command = {
    name: "help",
    description: "Menampilkan semua perintah",
    withPrefix: true,
    execute: async ({ m, msgProvider }) => {
        const userInfo = await m.auth.getUserInfo()
        const statusText = userInfo
            ? `✅ *Status:* Terhubung (${userInfo.name})`
            : `⚠️ *Status:* Belum Login (Ketik *.login*)`;

        await m.reply(msgProvider.get('default', {
            status: statusText 
        })!)
    }
}

export default helpCommand