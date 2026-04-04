import path from "path"
import fs from "fs"

export class JSONDB {
    private path: string
    private data: any | any[]

    constructor(targetPath: string, private initData?: any | any[]) {
        this.path = path.join(process.cwd(), targetPath)
        this.data = this.initData ?? []

        this.load()
    }


    public get get(): any | any[] {
        return this.data
    }

    public clear() {
        this.data = this.initData
    }
    
    load() {
        if (!fs.existsSync(this.path)) return this.write()

        try {
            this.data = JSON.parse(fs.readFileSync(this.path, 'utf-8'))
        } catch (error) {
            throw error
        }
    }

    write() {
        fs.writeFileSync(this.path, JSON.stringify(this.data, null, 2))
    }
}