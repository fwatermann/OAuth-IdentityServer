import express from "express";
import config from "../config/config.json";
import * as OAuth from "../database/OAuthDB";

export default async function parseUser(req: express.Request, res: express.Response, next: express.NextFunction) {
    if(req.signedCookies[config.session.cookie.name]) {
        try {
            req.session = JSON.parse(req.signedCookies[config.session.cookie.name]);
            if(req.session) {
                req.user = await OAuth.User.get(req.session.sessionUser);
            }
        } catch(e) {
            console.error("Error while parsing session cookie: ", e);
            next(e);
            return;
        }
    }
    next();
}
