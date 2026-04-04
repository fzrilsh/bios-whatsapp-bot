import { Command } from "../types/command.type.js"

const logoutCommand: Command = {
    name: "logout",
    description: "Keluar dari sesi Binusmaya dan hapus data token kamu dari sistem dengan aman.",
    withPrefix: true,
    execute: async ({ m , msgProvider}) => {
        const userInfo = await m.auth.getUserInfo()
        if (!userInfo) {
            return await m.reply(msgProvider.get('unauthenticated')!)
        }

        const status = await m.auth.logout()
        switch (status) {
            case 200:
                await m.reply("✅ Logout berhasil.")
                break;
            
            case 401:
                await m.reply(msgProvider.get('unauthenticated')!)
                break;
        
            default:
                await m.reply("⚠️ Terjadi kesalahan teknis saat mencoba logout. Silakan coba lagi nanti.")
                break;
        }
    }
}

export default logoutCommand