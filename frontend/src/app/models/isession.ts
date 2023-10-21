export interface ISession {
    userId: number;
    sessionType: string;
    startTime: Date;
    endTime: Date;
    sessionMinutes: number;
    sessionSeconds: number;
}
