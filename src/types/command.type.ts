import type { WASocket } from "baileys";
import { MessageProvider } from "../utils/message-provider.js";
import { ExtendedMessage } from "./extended-message.type.js";

export interface Command {
    name: string
    description: string
    withPrefix: boolean
    alias?: string[]
    mustOwner?: boolean
    execute: (context: {sock: WASocket, m: ExtendedMessage, args: string[], commands: Map<string, Command>, command: string, msgProvider: MessageProvider}) => Promise<any>
}