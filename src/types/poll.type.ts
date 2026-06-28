import type { WAMessage } from "baileys"

export interface PollOption {
    /** Judul/pertanyaan yang ditampilkan di poll */
    name: string
    /** Daftar pilihan yang tersedia */
    values: string[]
    /** Jumlah pilihan yang bisa dipilih user (default: 1) */
    selectableCount?: number
    /** Waktu tunggu sebelum poll expire dalam ms (default: 60000) */
    timeoutMs?: number
}

export interface PendingPoll {
    chatJid: string
    pollMessage: WAMessage
    values: string[]
    resolve: (value: string) => void
    reject: (reason: any) => void
    timer: ReturnType<typeof setTimeout>
}
