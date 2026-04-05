import { WASocket } from "baileys";
import { AllowedUsersService } from "../services/allowed-users.service.js";
import { Command } from "../types/command.type.js";
import { ExtendedMessage } from "../types/extended-message.type.js";
import { MessageProvider } from "../utils/message-provider.js";

export async function reactionMessage(m: ExtendedMessage, allowedUsers: AllowedUsersService, sock: WASocket, commands: Map<string, Command>, msgProvider: MessageProvider) {
    const reactionText = m.message?.reactionMessage?.text
    if (!m.isOwner) return

    allowedUsers.handleUserPermit(m, reactionText!, sock, commands, msgProvider)
}