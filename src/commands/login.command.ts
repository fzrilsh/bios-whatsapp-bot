import { Command } from "../types/command.type.js"
import pLimit from 'p-limit';

const limit = pLimit(2)
const activeLogins = new Set<string>()

const LoginCommand: Command = {
    name: "login",
    description: "Autentikasi akun Microsoft Binusmaya untuk mengaktifkan fitur bot.",
    withPrefix: true,
    execute: async ({ sock, m, args }) => {
        const userInfo = await m.auth.getUserInfo()
        if (userInfo) {
            return await m.reply("✅ Login berhasil.\nSilahkan lanjutkan aktivitas kamu!")
        }

        if (args.length < 2) {
            return await m.reply("Format salah. Gunakan: *.login [email] [password]*")
        }

        if (activeLogins.has(m.sender)) {
            return await m.reply(`⚠️ Kamu sedang dalam proses login. Mohon tunggu sampai selesai sebelum mencoba lagi.\n\nAntrian saat ini: ${limit.pendingCount}`)
        }

        const [email, password] = args
        activeLogins.add(m.sender)

        if (limit.pendingCount > 0) {
            await m.reply(`Sistem sedang sibuk (Antrean: ${limit.pendingCount}). Mohon tunggu sebentar...`)
        }

        const msg = await m.reply(`⏳ Process login sedang berlangsung, mohon tunggu beberapa saat sampai proses login selesai.`)
        const trackerKey = msg?.key

        const status = await limit(async () => await m.auth.login(email, password))
        switch (status) {
            case 409:
            case 200:
                await sock.sendMessage(m.chat, { edit: trackerKey, text: "✅ Login berhasil.\nSilahkan lanjutkan aktivitas kamu!", mentions: [m.sender] })
                break;
            
            case 400:
                await sock.sendMessage(m.chat, { edit: trackerKey, text: "❌ Login gagal.\nEmail atau password salah, atau terjadi kendala pada sistem Binus.", mentions: [m.sender] })
                break;
        
            default:
                await sock.sendMessage(m.chat, { edit: trackerKey, text: "⚠️ Terjadi kesalahan teknis saat mencoba login. Silakan coba lagi nanti.", mentions: [m.sender] })
                break;
        }

        activeLogins.delete(m.sender)
    }
}

export default LoginCommand