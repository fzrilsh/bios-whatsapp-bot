import { getAggregateVotesInPollMessage, type WAMessage, type WAMessageKey, type WASocket } from "baileys"
import { PendingPoll, PollOption } from "../types/poll.type.js"
import { logger } from "./logger.js"

const DEFAULT_TIMEOUT_MS = 60_000

export class PollManager {
    private pendingPolls = new Map<string, PendingPoll>()

    /**
     * Mengirim poll ke chat dan menunggu response dari user.
     * Return Promise<string> yang resolve dengan nama opsi yang dipilih.
     * Jika timeout, promise akan reject.
     */
    public async sendPoll(sock: WASocket, chatJid: string, option: PollOption): Promise<string> {
        const timeoutMs = option.timeoutMs ?? DEFAULT_TIMEOUT_MS

        const sentMsg = await sock.sendMessage(chatJid, {
            poll: {
                name: option.name,
                values: option.values,
                selectableCount: option.selectableCount ?? 1
            }
        })

        if (!sentMsg || !sentMsg.key?.id) {
            throw new Error("Gagal mengirim poll message")
        }

        const pollMsgId = sentMsg.key.id

        return new Promise<string>((resolve, reject) => {
            const timer = setTimeout(async () => {
                this.pendingPolls.delete(pollMsgId)

                try {
                    await sock.sendMessage(chatJid, {
                        text: "⏰ *Waktu Habis*\nKamu tidak memilih opsi apapun.",
                        edit: sentMsg.key as WAMessageKey
                    })
                } catch (err) {
                    logger.error("POLL_TIMEOUT_EDIT_ERROR", err)
                }

                reject(new Error("Poll timeout"))
            }, timeoutMs)

            this.pendingPolls.set(pollMsgId, {
                chatJid,
                pollMessage: sentMsg,
                values: option.values,
                resolve,
                reject,
                timer
            })
        })
    }

    /**
     * Dipanggil oleh handler messages.update ketika ada pollUpdates.
     * Mencocokkan poll ID, decode vote, resolve promise, dan edit pesan poll.
     */
    public async handlePollUpdate(sock: WASocket, pollMsgKey: WAMessageKey, pollUpdates: WAMessage["pollUpdates"]): Promise<void> {
        const pollMsgId = pollMsgKey.id
        if (!pollMsgId) return

        const pending = this.pendingPolls.get(pollMsgId)
        if (!pending) return

        try {
            const votes = getAggregateVotesInPollMessage({
                message: pending.pollMessage.message,
                pollUpdates: pollUpdates
            })

            // Cari opsi yang dipilih (yang punya voter)
            const selectedVote = votes.find(v => v.voters.length > 0)
            if (!selectedVote) return

            const selectedOption = selectedVote.name

            // Cleanup
            clearTimeout(pending.timer)
            this.pendingPolls.delete(pollMsgId)

            // Edit pesan poll menjadi konfirmasi agar user tidak bisa vote ulang
            try {
                await sock.sendMessage(pending.chatJid, {
                    text: `✅ Kamu memilih: *${selectedOption}*`,
                    edit: pollMsgKey
                })
            } catch (err) {
                logger.error("POLL_EDIT_ERROR", err)
            }

            // Resolve promise dengan opsi yang dipilih
            pending.resolve(selectedOption)
        } catch (err) {
            logger.error("POLL_VOTE_DECODE_ERROR", err)
        }
    }
}

export const pollManager = new PollManager()
