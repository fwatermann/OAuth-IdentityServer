import express from "express";
import config from "../config/config.json";

const router = express.Router();
export default router;

router.get("/", async (req, res) => {
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
    res.error("METHOD_NOT_ALLOWED", `This endpoint does not support "${req.method}"`);
});
