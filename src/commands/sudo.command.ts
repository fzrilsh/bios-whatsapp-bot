import { messageUpsert } from "../handlers/message-upsert.js";
import { Command } from "../types/command.type.js"

const sudoCommand: Command = {
    name: "sudo",
    description: "Menjalankan perintah atas nama user lain",
    withPrefix: true,
    mustOwner: true,
    execute: async ({ sock, m, args, commands, msgProvider }) => {
        if (args.length < 2) return m.reply("Format salah! Contoh: .sudo 628xxx .login email pass")

        let targetNumber = args.shift()!
        const targetJid = targetNumber.includes("@s.whatsapp.net") 
            ? targetNumber 
            : targetNumber.replace(/[^0-9]/g, "") + "@s.whatsapp.net"

        const sudoText = args.join(" ")

        await m.reply(`🕵️ *SUDO MODE:* Menjalankan perintah untuk @${targetJid.split('@')[0]}...`, true, { mentions: [targetJid] })

        const fakeChatUpdate = {
            messages: [
                {
                    key: {
                        remoteJid: targetJid,
                        fromMe: false,
                        id: "SUDO-" + Date.now(), 
                        addressingMode: 'pn'
                    },
                    message: {
                        conversation: sudoText
                    },
                    messageTimestamp: Math.floor(Date.now() / 1000),
                    pushName: "Sudo User"
                }
            ]
        }

        await messageUpsert(sock, fakeChatUpdate as any, commands, msgProvider)
    }
}

export default sudoCommand