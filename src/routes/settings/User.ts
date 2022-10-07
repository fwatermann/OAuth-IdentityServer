import express from "express";
import template from "../templates";
import * as Node2FA from "node-2fa";
import config from "../../config/config.json";
import qrcode from "qrcode";

const router = express.Router();
export default router;

export type UserSettingsPages = "settings/user/profile.html"|"settings/user/details.html"|"settings/user/security.html"|"settings/user/access.html";


router.get("/:page", async (req, res, next) => {

    switch(req.params.page) {
        case "profile":
            template("settings/user/profile.html", {}, req, res, next);
            return;
        case "details":
            template("settings/user/details.html", {}, req, res, next);
            return;
        case "security":
            await sendSecurity(req, res, next);
            return;
        case "access":
            template("settings/user/access.html", {}, req, res, next);
            return;
        default:
            res.error("NOT_FOUND");
            return;
    }

});

async function sendSecurity(req: express.Request, res: express.Response, next: express.NextFunction) {

    let mfaSecret = Node2FA.generateSecret({
        name: config.ui.globalPlaceholder.serviceName,
        account: req.user.username
    });

    let qrCode = await qrcode.toDataURL(mfaSecret.uri, {
        type: "image/png",
        errorCorrectionLevel: "high",
        scale: 4,
        margin: 0,
        color: {dark: "", light: "#00000000"}
    });
    template("settings/user/security.html", {
        mfa_qrCodeURI: qrCode,
        mfa_secret: mfaSecret.secret,
    }, req, res, next);
}
