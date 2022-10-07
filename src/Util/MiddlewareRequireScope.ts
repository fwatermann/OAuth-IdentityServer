import express from "express";

export default function requireScope(allowLoggedInUsers: boolean, ...scopes: string[]) {

    return async function(req: express.Request, res: express.Response, next: express.NextFunction) {
        if(req.user && allowLoggedInUsers && req.loggedIn) {
            if(req.token && req.token.userId != req.user.userId) {
                res.error("UNAUTHORIZED", "Token mismatch. Provided token does not fit to the logged in user.");
                return;
            } else {
                next(); //LoggedIn Users have all scopes to this account.
                return;
            }
        }

        if(!req.token) {
            res.error("UNAUTHORIZED", "No authorization token provided.");
            return;
        }

        let tokenScopes = req.token.tokenScopes.map<string>((obj) => obj.scope);

        for(let i = 0; i < scopes.length; i++) {
            if(tokenScopes.indexOf(scopes[i]) < 0) {
                res.error("FORBIDDEN", "The authorization token is not valid for scope: " + scopes[i]);
                return;
            }
        }

        next(); //Success
    }

}
