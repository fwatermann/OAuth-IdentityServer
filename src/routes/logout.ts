import express from "express";
import * as OAuth from "../database/OAuthDB";
import config from "../config/config.json";
import {METHOD_NOT_ALLOWED} from "../errors";

const router = express.Router();
export default router;

router.get("/", async (req, res) => {
    if((req as any).session) {
        let sessionId = (req as any).session.sessionId;
        await OAuth.Session.remove(sessionId);
    }
    res.clearCookie(config.session.cookie.name);

    if(!req.query.redirect_uri) {
        res.redirect(config.ui.login_redirect);
        return;
    } else {
        res.redirect(req.query.redirect_uri as string);
        return;
    }
});

router.all("/", (req, res, next) => {
    res.status(405).json(METHOD_NOT_ALLOWED("Invalid request method for this endpoint.", undefined, ["GET", "POST"]));
});
