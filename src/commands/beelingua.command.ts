import { BeelinguaService } from "../services/beelingua.service.js"
import { Command } from "../types/command.type.js"
import { logger } from "../utils/logger.js"

const beelinguaCommand: Command = {
    name: "beelingua",
    description: "Automasi Beelingua: Pantau progres belajar kamu dan selesaikan course dengan cepat.",
    alias: ["bl"],
    withPrefix: true,
    execute: async ({ sock, m, args, msgProvider }) => {
        const auth = await m.auth.getUserInfo()
        if (!auth) {
            return await m.reply(msgProvider.get('unauthenticated')!)
        }

        const service = new BeelinguaService(m.sender)

        let profile;
        try {
            profile = await service.getProfile()
        } catch (error) {
            return await m.reply(`❌ *Error*\nGagal mengambil data profil Beelingua. Pastikan layanan sedang aktif.`)
        }

        if (!args.length) {
            return await m.reply(msgProvider.get('beelingua', { token: profile.tokens })!)
        }

        const action = args.shift() // Mengambil command pertama (info/solve/buy/dll)

        switch (action) {
            case 'info': {
                const journeys = await service.getJourneys()
                if (!journeys || !journeys.length) {
                    return await m.reply(msgProvider.get('token-invalid', { name: auth.name })!)
                }

                if (args.length === 0) {
                    const journeyList = journeys.map((j: any, i: number) => {
                        return `*[${i + 1}]* ${j.journeyTitle}`
                    }).join("\n")

                    return await m.reply(msgProvider.get('beelingua-journey-list', { journeyList })!)
                }

                const journeyIndex = parseInt(args[0]!) - 1
                const journey = journeys[journeyIndex]

                if (!journey) {
                    return await m.reply(`❌ Nomor journey salah. Ketik *.bl info* untuk melihat daftar.`)
                }

                const courses = await service.getCourses(journey.journeyId)
                if (args.length === 1) {
                    let totalDone = 0
                    let totalPending = 0

                    const courseListText = courses.map((course: any, index: number) => {
                        const isDone = course.overallProgress === 100 || course.status === "done"
                        if (isDone) totalDone++
                        else totalPending++

                        const statusIcon = isDone ? "✅" : "📖"
                        const progressTag = isDone ? "*FINISHED*" : `*${course.overallProgress}%*`

                        return `*[${index + 1}]* ${statusIcon} [${course.courseCode}] ${course.courseTitleEn}\n   └ Progress: ${progressTag} (${course.unitCompleted}/${course.unitTotal} Units)`
                    }).join("\n\n")

                    return await m.reply(msgProvider.get('beelingua-course-list', {
                        courseListText,
                        totalDone,
                        totalPending,
                        total: courses.length,
                        journeyId: args[0]
                    })!)
                }

                const courseIndex = parseInt(args[1]!) - 1
                const course = courses[courseIndex]

                if (!course) {
                    return await m.reply(`❌ Nomor course salah. Ketik *.bl info ${args[0]}* untuk melihat daftar course.`)
                }

                const courseDetail = await service.pollProgress(course.classId)

                const barLength = (courseDetail.unitGroups as any[]).length
                const filled = Math.round((course.unitCompleted / course.unitTotal) * barLength)
                const progressBar = "▓".repeat(filled) + "░".repeat(barLength - filled)

                const unitListText = courseDetail.unitGroups.map((group: any) => {
                    const units = group.units.map((unit: any) =>
                        `${unit.unitNumber}. ${unit.unitCode}: ${unit.overallProgress}% ${unit.status == 'done' && group.unitGroupStatus != 'done' ? '✅' : ''}`
                    ).join('\n')

                    return `*[Group ${group.unitGroup}]* ${group.unitGroupStatus == 'done' ? '✅' : ''}\n${units}`
                }).join('\n\n')

                await m.reply(msgProvider.get('beelingua-list', {
                    courseTitleEn: course.courseTitleEn,
                    courseCode: course.courseCode,
                    progressBar,
                    overallProgress: course.overallProgress,
                    unitCompleted: course.unitCompleted,
                    unitTotal: course.unitTotal,
                    unitListText
                })!)
                break;
            }

            case 'solve': {
                const journeys = await service.getJourneys()
                if (!journeys || !journeys.length) {
                    return await m.reply(msgProvider.get('token-invalid', { name: auth.name })!)
                }

                if (args.length === 0) {
                    const journeyList = journeys.map((j: any, i: number) => {
                        return `*[${i + 1}]* ${j.journeyTitle}`
                    }).join("\n")

                    return await m.reply(msgProvider.get('beelingua-journey-solve-list', {
                        journeyList
                    })!)
                }

                const journeyIndex = parseInt(args[0]!) - 1
                const journey = journeys[journeyIndex]

                if (!journey) {
                    return await m.reply(`❌ Nomor journey salah. Ketik *.bl solve* untuk melihat daftar.`)
                }

                const courses = await service.getCourses(journey.journeyId)
                const course = courses.find((v: any) => v.overallProgress != 100)

                if (!course) {
                    return await m.reply(`✅ Selamat, semua course di journey ini telah selesai!`)
                }

                if (profile.tokens < 1) {
                    return await m.reply(`❌ *SALDO HABIS*\nMaaf, token kamu saat ini sudah habis. Silakan ketik *.bl buy* untuk beli token.`)
                }

                const loadingMsg = await m.reply(`🚀 *Automasi Dimulai*\nSistem sedang mengerjakan course [${course.courseCode}] di background. Tunggu sebentar ya...`)

                let isFinished = false
                const startTime = Date.now()

                const pollInterval = setInterval(async () => {
                    try {
                        const progressData = await service.pollProgress(course.classId)
                        const units = progressData.unitGroups.flatMap((group: any) => group.units ?? [])

                        const totalUnits = units.length

                        const doneUnits = units.filter((u: any) => u.status === 'done').length
                        const elapsedSeconds = (Date.now() - startTime) / 1000

                        let etaText = "Menghitung..."
                        if (doneUnits > 0) {
                            const avgTimePerUnit = elapsedSeconds / doneUnits
                            const remainingUnits = totalUnits - doneUnits
                            const remainingSeconds = remainingUnits * avgTimePerUnit

                            const m = Math.floor(remainingSeconds / 60)
                            const s = Math.round(remainingSeconds % 60)
                            etaText = `${m}m ${s}s`
                        }

                        await sock.sendMessage(m.chat, {
                            text: `🚀 *Automasi Berjalan*\nCourse: [${course.courseCode}]\nProgress: ${doneUnits}/${totalUnits} Unit\nEstimasi Selesai: ${etaText}`,
                            edit: loadingMsg!.key
                        })

                        if (!progressData.state.status) {
                            isFinished = true
                            clearInterval(pollInterval)
                            await sock.sendMessage(m.chat, {
                                text: "❌ *Gagal*\nTerjadi kesalahan saat memulai automasi di server.",
                                edit: loadingMsg!.key
                            })

                            throw progressData.state.message
                        }

                        if (doneUnits >= totalUnits || progressData.state.status == 2) {
                            isFinished = true
                            clearInterval(pollInterval)
                            await sock.sendMessage(m.chat, {
                                text: `✅ *Automasi Selesai*\nCourse [${course.courseCode}] berhasil diselesaikan! 1 Token telah digunakan.`,
                                edit: loadingMsg!.key
                            })
                        }
                    } catch (error) {
                        logger.error("Polling error during solveCourse", error)
                    }
                }, 10000)

                const isStarted = await service.solveCourse(course.classId)
                if (!isStarted) {
                    isFinished = true
                    clearInterval(pollInterval)
                    return await sock.sendMessage(m.chat, {
                        text: "❌ *Gagal*\nTerjadi kesalahan saat memulai automasi di server.",
                        edit: loadingMsg!.key
                    })
                }

                setTimeout(() => {
                    if (!isFinished) {
                        clearInterval(pollInterval)
                        sock.sendMessage(m.chat, {
                            text: `⚠️ *Waktu Tunggu Habis*\nProses mungkin masih berjalan di background. Silakan cek manual menggunakan *.bl info ${args[0]}*`,
                            edit: loadingMsg!.key
                        })
                    }
                }, 15 * 60 * 1000)

                break;
            }

            case 'buy':
                await m.reply(msgProvider.get('beelingua-payment-instruction', { id: m.sender.split('@')[0]! })!)
                break;

            case 'report': {
                if (!m.isOwner) return await m.reply(msgProvider.get('beelingua', { token: profile.tokens })!)

                try {
                    const users = await service.getAdminReport()
                    const totalBought = users.reduce((a: any, b: any) => a + b.totalBought, 0)
                    const totalBoughtUser = users.reduce((a: any, b: any) => b.totalBought > 0 ? a + 1 : a, 0)
                    const totalRevenue = new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 2
                    }).format(totalBought * (70000 / 2))

                    await m.reply(`📊 *Admin Report*\nTotal user: ${users.length}\nTotal pembeli: ${totalBoughtUser} (${(totalBoughtUser / totalBought * 100).toFixed(1)}%)\nTotal pemakaian: ${totalBought}\nTotal revenue: ${totalRevenue}`)
                } catch (error) {
                    await m.reply(`❌ Gagal mengambil report admin.`)
                }
                break;
            }

            case 'add-token': {
                if (!m.isOwner) return await m.reply(msgProvider.get('beelingua', { token: profile.tokens })!)
                if (args.length < 2) return await m.reply(`❌ Format salah. Gunakan: *.bl add-token [nomor] [jumlah]*`)

                try {
                    const targetJid = args[0] + '@s.whatsapp.net'
                    const amount = parseInt(args[1]!)
                    const add = await service.addTokenAdmin(targetJid, amount)
                    await sock.sendMessage(m.chat, { text: `✅ Berhasil menambahkan ${amount} token ke @${args[0]}\nToken saat ini: ${add.currentTokens}`, mentions: [targetJid] })
                } catch (error) {
                    await m.reply(`❌ Gagal menambahkan token. Pastikan nomor benar.`)
                }
                break;
            }

            case 'remove-token': {
                if (!m.isOwner) return await m.reply(msgProvider.get('beelingua', { token: profile.tokens })!)
                if (args.length < 2) return await m.reply(`❌ Format salah. Gunakan: *.bl remove-token [nomor] [jumlah]*`)

                try {
                    const targetJid = args[0] + '@s.whatsapp.net'
                    const amount = parseInt(args[1]!)
                    const remove = await service.removeTokenAdmin(targetJid, amount)
                    await sock.sendMessage(m.chat, { text: `✅ Berhasil mengurangi ${amount} token dari @${args[0]}\nToken saat ini: ${remove.currentTokens}`, mentions: [targetJid] })
                } catch (error) {
                    await m.reply(`❌ Gagal mengurangi token. Pastikan nomor benar.`)
                }
                break;
            }

            default:
                await m.reply(msgProvider.get('beelingua', { token: profile.tokens })!)
                break;
        }
    }
}

export default beelinguaCommand