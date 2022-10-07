import {Session} from "./types/Session";
import {OAuth__Token, OAuth__User} from "./database/Database";
import {ErrorFunction} from "./errors";


declare module "*.html";

declare global {
    namespace Express {
        interface Request {
            user: OAuth__User|null,
            session?: Session,
            token?: OAuth__Token|null
            loggedIn: boolean
        }
        interface Response {
            error: ErrorFunction;
            noContent: () => void;
        }
    }
}
