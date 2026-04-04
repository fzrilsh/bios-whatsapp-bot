import { Command } from "../types/command.type.js";
import { logger } from "../utils/logger.js";

const showLogsCommand: Command = {
    name: "logs",
    description: "System logs",
    withPrefix: true,
    mustOwner: true,
    execute: async ({ m, args }) => {
        const logs = logger.getRuntimeLogs(10)
        const action = args[0]

        switch (action) {
            case "msg":
                m.reply(JSON.stringify(m, null, 2))
                break;
                
            case "show":
                if (logs.length === 0) {
                    return m.reply("Belum ada error di runtime saat ini.")
                }

                await m.reply(`⚠️ *RUNTIME ERROR LOGS* ⚠️\n\n${logs.map((log, i) => {
                    return `${i + 1}. *[${log.context}]* _${log.timestamp}_\n> ${log.message}`
                }).join('\n\n')}`)
                break;

            case "clear":
                logger.clearRuntimeLogs()
                await m.reply("Berhasil clear logs di runtime saat ini.")
                break;

            default:
                break;
        }
    }
}

export default showLogsCommand