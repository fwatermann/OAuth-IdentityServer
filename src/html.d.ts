import {Session} from "./types/Session";

declare module "*.html";

declare global {
    namespace Express {
        interface Request {
            user?: any,
            session?: Session
        }
    }
}
