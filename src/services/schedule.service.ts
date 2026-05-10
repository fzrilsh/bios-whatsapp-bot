import config from "../config/index.js"
import { Schedule } from "../types/binusmaya.type.js"
import { fetcher } from "../utils/fetcher.js"
import { logger } from "../utils/logger.js"

export class ScheduleService {
    constructor(private id: string) { }

    public async fetchSchedule(by: string = 'Month') {
        const response: any[] = []
        let response_status = true
        let response_error = ''

        for (let index = 0; index < 2; index++) {
            const date = new Date()
            if (by == 'Month') {
                date.setMonth(date.getMonth() + index)
                date.setDate(1)
            } else {
                date.setDate(date.getDate() + index)
            }

            const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
            const { status, response_text, response_json } = await fetcher(`${config.API_BASE_URL}/schedule?by=${by}&date=${formattedDate}`, {
                headers: {
                    Authorization: process.env.API_PRIVATE_KEY,
                    userId: this.id
                }
            })

            if (!status) {
                response_status = status
                response_error = response_text
                break
            }

            if (response_json) {
                response.push(response_json.data)
            }
        }


        if (!response_status) {
            throw response_error
        }

        const now = new Date()
        return response.flat()
            .filter(v => now <= new Date(v.dateEnd))
            .sort((a, b) => (new Date(a.dateStart)).getTime() - new Date(b.dateStart).getTime())
    }

    public async insertAttendance(schedule: Schedule) {
        const { status, response_text } = await fetcher(`${config.API_BASE_URL}/schedule/attend`, {
            method: 'POST',
            headers: {
                Authorization: process.env.API_PRIVATE_KEY,
                'Content-Type': 'application/json',
                userId: this.id
            },
            body: JSON.stringify({
                classId: schedule.classId,
                dateStart: schedule.dateStart,
                dateEnd: schedule.dateEnd
            })
        })

        if (!status) {
            logger.error("Failed to insert attendance", response_text)
        }

        return status
    }
}