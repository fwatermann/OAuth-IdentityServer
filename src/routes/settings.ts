import express from "express";
import template from "./templates";
import {OAuth__User} from "../database/Database";
import routerUser from "./settings/User";
import routerAdmin from "./settings/Admin";
import requirePermission from "../Util/MiddlewarePermission";

const router = express.Router();
export default router;

router.get("/", (req, res, next) => {
    if(!req.user && req.loggedIn) {
        res.redirect(`/login?redirect_uri=${encodeURIComponent("/settings")}`);
        return;
    }
    let user : OAuth__User = req.user;
    template("settings.html", {
        profileAvatar: "https://cdn.w-mi.de/shorturl/images/user.png",
        profileDisplayname: user.displayName,
        permissions: user.permissions.map<string>((pobj) => pobj.permission),
    }, req, res, next);
});
router.use("/page/user", routerUser);
router.use("/page/admin", requirePermission("service:admin"), routerAdmin);
