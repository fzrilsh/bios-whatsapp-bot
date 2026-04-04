import path from "path"
import fs from "fs"
import { InvalidQueue } from "../types/allowed-users.type.js"
import { WASocket } from "baileys"
import { logger } from "../utils/logger.js"
import config from "../config/index.js"
import { ExtendedMessage } from "../types/extended-message.type.js"

export class AllowedUsersService {
    private dbPath = path.join(process.cwd(), "assets/database/allowed-users.json")
    private userInvalidQueue: Record<string, InvalidQueue>
    public users: string[]

    constructor() {
        this.users = []
        this.userInvalidQueue = {}

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

    public async handleUserNotAllowed(id: string, sock: WASocket, callback: () => void) {
        try {
            if (this.isAllowed(id) || config.OWNER_NUMBER === id.split("@")[0]) return callback()
            if (this.userInvalidQueue?.[id]) return
    
            const msgConfirm = await sock.sendMessage(config.OWNER_NUMBER + '@s.whatsapp.net', { text: `🚨 Allow @${id.split('@')[0]}?`, mentions: [id] })
            this.userInvalidQueue[id] = {
                callback,
                msgConfirmId: msgConfirm?.key.id!
            }
        } catch (error) {
            throw error
        }
    }

    public handleUserPermit(m: ExtendedMessage, icon: string) {
        const msgId = m.message?.reactionMessage?.key?.id
        const queueId = Object.values(this.userInvalidQueue).findIndex(v => v.msgConfirmId === msgId)
        if (queueId == -1) return

        const id = Object.keys(this.userInvalidQueue)[queueId]
        switch (icon) {
            case '👍':
                this.addUser(id)
                this.userInvalidQueue[id].callback()
                m.reply(`Berhasil menambahkan @${id.split('@')[0]} ke dalam daftar allowed users`, true, { mentions: [id] })
                break;
        }
    }
}