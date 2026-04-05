import path from "path"
import fs from "fs"
import { InvalidQueue } from "../types/allowed-users.type.js"
import { WASocket } from "baileys"
import { logger } from "../utils/logger.js"
import config from "../config/index.js"
import { ExtendedMessage } from "../types/extended-message.type.js"
import { JSONDB } from "../database/json-db.js"
import { messageUpsert } from "../handlers/message-upsert.js"
import { Command } from "../types/command.type.js"
import { MessageProvider } from "../utils/message-provider.js"

export class AllowedUsersService {
    private dbPath = path.join(process.cwd(), "assets/database/allowed-users.json")
    private userInvalidQueue: JSONDB
    public users: string[]

    constructor() {
        this.users = []
        this.userInvalidQueue = new JSONDB("assets/database/user-queue-allowed.json", {})

        this.ensureFile()
        this.readDB()
    }

    private async ensureFile() {
        const dir = path.dirname(this.dbPath)
        try {
            fs.accessSync(dir)
        } catch {
            fs.mkdirSync(dir, { recursive: true })
        }

        if (!fs.existsSync(this.dbPath)) {
            fs.writeFileSync(this.dbPath, JSON.stringify([], null, 2))
        }
    }

    private readDB() {
        try {
            const data = fs.readFileSync(this.dbPath, 'utf-8')
            this.users = JSON.parse(data)
        } catch (error) {
            logger.error(`Failed to read file ${this.dbPath}`, error)
            this.users = []
        }
    }

    private writeDB() {
        fs.writeFileSync(this.dbPath, JSON.stringify(this.users, null, 4))
    }

    private isAllowed(id: string) {
        return this.users.includes(id)
    }

    public addUser(id: string) {
        if (this.isAllowed(id)) return

        this.users.push(id)
        this.writeDB()
    }

    public removeUser(id: string) {
        if (!this.isAllowed(id)) return

        this.users.splice(this.users.findIndex(v => v == id), 1)
        this.writeDB()
    }

    public async handleUserNotAllowed(sock: WASocket, m: ExtendedMessage): Promise<boolean> {
        try {
            const id = m.sender
            if (this.isAllowed(id) || config.OWNER_NUMBER === id.split("@")[0]) return true
            if (this.userInvalidQueue.get?.[id]) return false

            const msgConfirm = await sock.sendMessage(config.OWNER_NUMBER + '@s.whatsapp.net', { text: `🚨 Allow @${id.split('@')[0]}?`, mentions: [id] })
            this.userInvalidQueue.get[id] = {
                message: m.message,
                msgConfirmId: msgConfirm?.key.id!
            }

            this.userInvalidQueue.write()
            return false
        } catch (error) {
            throw error
        }
    }

    public async handleUserPermit(m: ExtendedMessage, icon: string, sock: WASocket, commands: Map<string, Command>, msgProvider: MessageProvider) {
        const msgId = m.message?.reactionMessage?.key?.id
        const queueEntries = Object.entries(this.userInvalidQueue.get || {})

        const found = queueEntries.find(([_, data]: any) => data.msgConfirmId === msgId)
        if (!found) return

        const [userId, data]: [string, any] = found
        if (icon === '👍') {
            this.addUser(userId)
            delete this.userInvalidQueue.get[userId]
            this.userInvalidQueue.write()

            await m.reply(`✅ @${userId.split('@')[0]} telah di-allow. Menjalankan perintah...`, true, { mentions: [userId] })
            const fakeChatUpdate = {
                messages: [{
                    key: { remoteJid: userId, fromMe: false, id: data.msgConfirmId, addressingMode: 'pn' },
                    message: data.message,
                    messageTimestamp: Math.floor(Date.now() / 1000)
                }]
            }

            await messageUpsert(sock, fakeChatUpdate, commands, msgProvider)
        }
    }
}