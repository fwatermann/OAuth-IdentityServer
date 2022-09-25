export type Session = {
    sessionId: string,
    sessionUser: string,
    sessionExpires: number,
    sessionData: {
        [key: string]: string
    }
}
