import { proto, WAMessage } from "baileys";
import { AuthService } from "../services/auth.service.js";

export interface ExtendedMessage extends proto.IWebMessageInfo {
    id: string
    chat: string
    fromMe: boolean
    text: string
    isGroup: boolean
    isOwner: boolean
    sender: string
    auth: AuthService
    read: () => Promise<any>
    reply: (text: string, quote?: boolean, options?: object) => Promise<WAMessage | undefined>
    react: (emoji: string) => Promise<any>
}