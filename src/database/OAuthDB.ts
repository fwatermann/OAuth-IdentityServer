import * as OAuth from "./OAuthDB";

export * as User from "./OAuth/User";
export * as Client from "./OAuth/Client";
export * as Token from "./OAuth/Token";
export * as AuthCode from "./OAuth/AuthCode";


export function startCleanupTimer() {
    setTimeout(() => {
        startCleanupTimer();
    }, 30*60*1000);
    OAuth.Token.cleanupExpired();
    OAuth.AuthCode.cleanupExpired();
}
