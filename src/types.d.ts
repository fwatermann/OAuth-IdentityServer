import {Session} from "./types/Session";
import {OAuth__User} from "./database/Database";

declare module "*.html";

declare global {
    namespace Express {
        interface Request {
            user: OAuth__User|null,
            session?: Session
        }
    }
}
