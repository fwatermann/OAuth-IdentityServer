import express from "express";
import * as OAuth from "../database/OAuthDB";
import config from "../config/config.json";

const router = express.Router();
export default router;

router.all("/", async (req, res) => {
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
