import express from "express";
import template from "./templates";
import {UNAUTHORIZED} from "../errors";
import {OAuthUser} from "../database/OAuth/User";

const router = express.Router();
export default router;

router.get("/", (req, res, next) => {
    if(!(req as any).user) {
        res.redirect(`/login?redirect_uri=${encodeURIComponent("/settings")}`);
        return;
    }
    let user : OAuthUser = (req as any).user;
    template("settings.html", {
        profileAvatar: "https://cdn.w-mi.de/shorturl/images/user.png",
        profileDisplayname: "Test Account #1",
        isSupport: false,
        isAdmin: true,
    }, req, res, next);
});

router.get("/page/:page", (req, res, next) => {

    if(!(req as any).session) {
        res.status(401).json(UNAUTHORIZED("Not authorized", "You need to be logged in to load this page."));
        return;
    }

    let page = req.params.page;

    if(!page) {
        next();
        return;
    }

    switch(page) {
        case "profile":
            template("settings/profile.html", {}, req, res, next);
            return;
        default:
            next();
            return;
    }

});
