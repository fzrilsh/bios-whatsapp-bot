import { glob } from "glob";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { logger } from "./logger.js";
import { Command } from "../types/command.type.js";

export const loadCommands = async () => {
    const commands = new Map<string, Command>()

    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const isProduction = __dirname.includes(`${path.sep}dist`);
    const baseDir = isProduction ? 'dist' : 'src';
    const extension = isProduction ? 'js' : 'ts';

    const pattern = path.join(process.cwd(), baseDir, "commands", `**/*.${extension}`).replace(/\\/g, "/")
    const files = await glob(pattern)

    for (const file of files) {
        try {
            const fileUrl = pathToFileURL(file).href

            const module = await import(fileUrl)
            const cmd: Command = module.default

            if (cmd && cmd.name) {
                commands.set(cmd.name, cmd)
                cmd.alias?.forEach(alias => commands.set(alias, cmd))

                console.log(`Successfully loaded command: ${cmd.name}`)
            }
        } catch (error) {
            logger.error(`Failed to load command at ${file}`, error)
        }
    }

    return commands
}