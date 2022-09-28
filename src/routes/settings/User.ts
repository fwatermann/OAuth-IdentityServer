import express from "express";
import template from "../templates";

const router = express.Router();
export default router;

export type UserSettingsPages = "settings/user/profile.html"|"settings/user/details.html"|"settings/user/security.html"|"settings/user/access.html";


router.get("/:page", (req, res, next) => {

    switch(req.params.page) {
        case "profile":
            template("settings/user/profile.html", {}, req, res, next);
            return;
        case "details":
            template("settings/user/details.html", {}, req, res, next);
            return;
        case "security":
            template("settings/user/security.html", {}, req, res, next);
            return;
        case "access":
            template("settings/user/access.html", {}, req, res, next);
            return;
        default:
            res.error("NOT_FOUND");
            return;
    }

});
