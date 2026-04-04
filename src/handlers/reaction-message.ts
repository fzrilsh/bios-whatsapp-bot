import { AllowedUsersService } from "../services/allowed-users.service.js";
import { ExtendedMessage } from "../types/extended-message.type.js";

export async function reactionMessage(m: ExtendedMessage, allowedUsers: AllowedUsersService) {
    const reactionText = m.message?.reactionMessage?.text
    if (!m.isOwner) return

    allowedUsers.handleUserPermit(m, reactionText!)
}