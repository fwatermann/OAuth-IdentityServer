import express from "express";
import template from "../templates";

const router = express.Router();
export default router;

export type UserSettingsPages = "settings/user/profile.html"


router.get("/:page", (req, res, next) => {

    switch(req.params.page) {
        case "profile":
            template("settings/user/profile.html", {}, req, res, next);
            return;
    }


});
