import fs from "fs"
import { glob } from "glob"
import path from "path"

export class MessageProvider {
    private messages: Map<string, string> = new Map()
    private readonly messagePath = path.join(process.cwd(), "assets/messages")

    constructor() {
        this.init()
    }

    async init(){
        const files = await glob(`${this.messagePath}/*txt`)

        for (const file of files) {
            const filename = path.basename(file, ".txt")
            const content = fs.readFileSync(file, "utf-8")
            this.messages.set(filename, content.trim())
        }

        console.log(`Loaded ${this.messages.size} message templates.`)
    }

    get(key: string, variables: Record<string, string | number> = {}): string | null {
        let msg = this.messages.get(key)
        if (!msg) return null

        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g')
            msg = msg.replace(regex, value.toString())
        }

        return msg
    }
}