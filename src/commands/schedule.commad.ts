import { ScheduleService } from "../services/schedule.service.js"
import { Command } from "../types/command.type.js"

const scheduleCommand: Command = {
    name: "jadwal",
    description: "Tampilkan jadwal perkuliahan atau lakukan absensi otomatis.",
    alias: ["schedule", "sc"],
    withPrefix: true,
    execute: async ({ m, args, msgProvider }) => {
        const auth = await m.auth.getUserInfo()
        if (!auth) {
            return await m.reply(msgProvider.get('unauthenticated')!)
        }

        const service = new ScheduleService(m.sender)
        const schedules = (await service.fetchSchedule()).slice(0, 4)

        if (!args.length) {
            if (schedules.length < 1) {
                return await m.reply(msgProvider.get("schedule-notfound", { name: auth.name })!)
            }

            const scheduleList = schedules.map((v, i) => {
                let statusIcon = "⚪"
                if (v.status === 1) statusIcon = "⏳"
                if (v.status === 2) statusIcon = "‼️"
                if (v.status === 3 || v.status === 4) statusIcon = "✅"

                const dateStart = new Date(v.dateStart)
                const type = v.class.includes('LAB') ? " *[LAB]*" : ""

                return `*[${i + 1}]* ${v.subject}${type} ${statusIcon}\n- Tanggal: ${dateStart.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}\n- Lokasi: ${v.location}`
            }).join("\n\n")

            return await m.reply(msgProvider.get("schedule-list", { list: scheduleList, name: auth.name })!)
        }

        const index = parseInt(args[0]) - 1
        const selectedSchedule = schedules[index]

        if (!selectedSchedule) {
            return await m.reply(`❌ Nomor jadwal salah. Silakan cek daftar dengan mengetik *.jadwal*`)
        }

        const success = await service.insertAttendance(selectedSchedule)
        if (!success) return await m.reply(msgProvider.get('attendance-failed', {
            subject: selectedSchedule.subject,
            time: `${new Date(selectedSchedule.dateStart).getHours().toString().padStart(2, '0')}:${new Date(selectedSchedule.dateStart).getMinutes().toString().padStart(2, '0')}`
        })!)

        await m.reply(msgProvider.get('attendance-success', {
            name: auth.name,
            subject: selectedSchedule.subject,
            time: new Date(selectedSchedule.dateStart).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' }),
            location: selectedSchedule.location
        })!)
    }
}

export default scheduleCommand