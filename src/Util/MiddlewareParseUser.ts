import express from "express";
import config from "../config/config.json";
import * as OAuth from "../database/OAuthDB";

export default async function parseUser(req: express.Request, res: express.Response, next: express.NextFunction) {

    if(req.headers.authorization) {
        let header = req.headers.authorization.split(" ");
        let tokenType = header[0];
        let tokenStr = header[1];
        if(tokenType !== "Bearer") {
            res.error("UNAUTHORIZED", "Invalid token type.");
            return;
        }
        if(!tokenStr) {
            res.error("UNAUTHORIZED", "Invalid token.");
            return;
        }
        let token = await OAuth.Token.get(tokenStr);
        if(!token) {
            res.error("UNAUTHORIZED", "Invalid token.");
            return;
        }
        if(token.tokenExpires.getTime() < Date.now()) {
            res.error("UNAUTHORIZED", "Token expired.");
            return;
        }
        req.token = token;
        req.user = await OAuth.User.get(req.token?.userId);
    } else {
        req.token = null;
    }

    if(req.signedCookies[config.session.cookie.name]) {
        try {
            req.session = JSON.parse(req.signedCookies[config.session.cookie.name]);
            if(req.session) {

                if(req.token && req.token.userId != req.session.sessionUser) {
                    res.error("UNAUTHORIZED", "Token mismatch. Provided token does not fit to the logged in user.");
                    return;
                }

                req.user = await OAuth.User.get(req.session.sessionUser);
                if(req.user) {
                    req.loggedIn = true;
                }
            }
        } catch(e) {
            console.error("Error while parsing session cookie: ", e);
            next(e);
            return;
        }
    }

    next();
}
