import type { WAMessageUpdate, WASocket } from "baileys"
import type { PollManager } from "../utils/poll-manager.js"

export async function pollUpdate(sock: WASocket, updates: WAMessageUpdate[], pollMgr: PollManager) {
    for (const { key, update } of updates) {
        if (!update.pollUpdates) continue

        await pollMgr.handlePollUpdate(sock, key, update.pollUpdates)
    }
}
