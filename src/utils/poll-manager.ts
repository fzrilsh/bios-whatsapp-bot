import { decryptPollVote, jidNormalizedUser, type proto, type WAMessage, type WAMessageKey, type WASocket } from "baileys"
import { createHash } from "crypto"
import { PendingPoll, PollOption } from "../types/poll.type.js"
import { logger } from "./logger.js"

const DEFAULT_TIMEOUT_MS = 60_000

export class PollManager {
    private pendingPolls = new Map<string, PendingPoll>()
    private pollSecrets = new Map<string, Uint8Array>()

    public getMessage = async (key: WAMessageKey): Promise<proto.IMessage | undefined> => {
        const pending = this.pendingPolls.get(key.id!)
        return pending?.pollMessage?.message ?? undefined
    }

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

    public updatePendingPollMessage(msg: proto.IWebMessageInfo) {
        if (!msg.key || !msg.key.id) return
        const newSecret = msg.message?.messageContextInfo?.messageSecret
        if (newSecret) {
            this.pollSecrets.set(msg.key.id, newSecret)
        }

        const pending = this.pendingPolls.get(msg.key.id)
        if (pending) {
            pending.pollMessage = msg as WAMessage
        }
    }

    public async handlePollVote(sock: WASocket, msg: proto.IWebMessageInfo): Promise<void> {
        const pollUpdate = msg.message?.pollUpdateMessage
        if (!pollUpdate) return

        const pollCreationKey = pollUpdate.pollCreationMessageKey
        if (!pollCreationKey?.id) return

        const pending = this.pendingPolls.get(pollCreationKey.id)
        if (!pending) {
            return
        }

        try {
            const messageSecret = this.pollSecrets.get(pollCreationKey.id) || pending.pollMessage.message?.messageContextInfo?.messageSecret
            const pollCreationMsg = pending.pollMessage.message?.pollCreationMessage
                || pending.pollMessage.message?.pollCreationMessageV2
                || pending.pollMessage.message?.pollCreationMessageV3


            if (!messageSecret || !pollCreationMsg || !pollUpdate.vote) return

            const botId = sock.user?.id ? sock.user.id.split(':')[0] + '@s.whatsapp.net' : ""
            const fallbackCreator = pending.pollMessage.key?.participant || pending.pollMessage.key?.remoteJid || ""

            const pollCreatorJid = botId || jidNormalizedUser(fallbackCreator)

            let voterJid = msg.key?.participant || msg.key?.remoteJid || ""

            if (msg.key?.fromMe) {
                voterJid = botId || voterJid
            } else {
                voterJid = jidNormalizedUser(voterJid)
            }


            const possibleVoterJids = new Set<string>()
            if (msg.key?.participant) possibleVoterJids.add(msg.key.participant)
            if (msg.key?.remoteJid) possibleVoterJids.add(msg.key.remoteJid)
            if ((msg.key as any)?.participantAlt) possibleVoterJids.add((msg.key as any).participantAlt)
            if ((msg.key as any)?.remoteJidAlt) possibleVoterJids.add((msg.key as any).remoteJidAlt)
            if (pending.chatJid) possibleVoterJids.add(pending.chatJid)
            possibleVoterJids.add(botId)

            const normalizedVoters = Array.from(possibleVoterJids).map(j => jidNormalizedUser(j))
            normalizedVoters.forEach(j => possibleVoterJids.add(j))

            const possibleCreatorJids = new Set<string>()
            possibleCreatorJids.add(botId)
            if (pending.pollMessage.key?.participant) possibleCreatorJids.add(pending.pollMessage.key.participant)
            if (pending.pollMessage.key?.remoteJid) possibleCreatorJids.add(pending.pollMessage.key.remoteJid)
            if ((pending.pollMessage.key as any)?.participantAlt) possibleCreatorJids.add((pending.pollMessage.key as any).participantAlt)
            if ((pending.pollMessage.key as any)?.remoteJidAlt) possibleCreatorJids.add((pending.pollMessage.key as any).remoteJidAlt)
            if (sock.user?.id) possibleCreatorJids.add(sock.user.id)
            if (sock.user?.id) possibleCreatorJids.add(jidNormalizedUser(sock.user.id))
            if ((sock.user as any)?.lid) {
                possibleCreatorJids.add((sock.user as any).lid)
                possibleCreatorJids.add(jidNormalizedUser((sock.user as any).lid))
            }

            let decryptedVote: proto.Message.PollVoteMessage | null = null
            let successVoter = ""
            let successCreator = ""

            for (const cJid of possibleCreatorJids) {
                for (const vJid of possibleVoterJids) {
                    try {
                        decryptedVote = decryptPollVote(
                            pollUpdate.vote,
                            {
                                pollCreatorJid: cJid,
                                pollMsgId: pollCreationKey.id,
                                pollEncKey: new Uint8Array(messageSecret),
                                voterJid: vJid,
                            }
                        )
                        if (decryptedVote) {
                            successCreator = cJid
                            successVoter = vJid
                            break
                        }
                    } catch (e) {
                        // ignore error, try next combination
                    }
                }
                if (decryptedVote) break
            }

            if (!decryptedVote) {
                logger.error("POLL_VOTE_DECODE_ERROR", new Error("All JID combinations failed to decrypt vote"))
                return
            }

            if (!decryptedVote.selectedOptions || decryptedVote.selectedOptions.length === 0) return

            const selectedOption = this.matchVoteToOption(decryptedVote.selectedOptions, pending.values)
            if (!selectedOption) return

            clearTimeout(pending.timer)
            this.pendingPolls.delete(pollCreationKey.id)

            try {
                await sock.sendMessage(pending.chatJid, {
                    delete: pending.pollMessage.key as WAMessageKey
                })
            } catch (err) {
                logger.error("POLL_EDIT_ERROR", err)
            }

            pending.resolve(selectedOption)
        } catch (err) {
            logger.error("POLL_VOTE_DECODE_ERROR", err)
        }
    }

    private matchVoteToOption(selectedHashes: Uint8Array[], values: string[]): string | null {
        for (const optionName of values) {
            const optionHash = createHash("sha256").update(optionName).digest()

            for (const selectedHash of selectedHashes) {
                if (Buffer.from(optionHash).equals(Buffer.from(selectedHash))) {
                    return optionName
                }
            }
        }
        return null
    }
}

export const pollManager = new PollManager()
