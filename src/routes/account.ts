import express from "express";
import template from "../templates/templates";

const router = express.Router();
export default router;

router.get("/", (req, res, next) => {
    template("account.html", {
        profileAvatar: "https://cdn.w-mi.de/shorturl/images/user.png",
        profileDisplayname: "Test Account #1"
    }, req, res, next);
});
