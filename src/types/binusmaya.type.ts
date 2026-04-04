export interface UserData {
    name: string
    email: string
}

export interface Schedule {
    dateStart: Date;
    dateEnd: Date;
    subject: string;
    class: string;
    classId: string;
    location: string;
    locationCode: string;
    session: number;
    sessionId: string;
    scheduleType: string;
    status: number; // 0: didnt attend | 1: ongoing schedule | 2: attend completed
}