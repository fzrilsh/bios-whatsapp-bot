import { Command } from "../types/command.type.js"

const pingCommand: Command = {
    name: "ping",
    description: "Cek status bot",
    withPrefix: true,
    execute: async ({ m }) => {
        await m.reply("Pong!")
    }
}

export default pingCommand