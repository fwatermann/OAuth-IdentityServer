import express from "express";
import requireScope from "../../../Util/MiddlewareRequireScope";
import * as Node2FA from "node-2fa";
import qrcode from "qrcode";
import config from "../../../config/config.json";


const router = express.Router();
export default router;

router.post("/", async (req, res, next) => {
    if(req.body.status) {
        if(req.body.status === "enable") {
            if(!req.body.secret) {
                res.error("BAD_REQUEST", "Missing secret.");
                return;
            }
            if(!req.body.mfaCode) {
                res.error("BAD_REQUEST", "Missing code.");
                return;
            }
            let verified = Node2FA.verifyToken(req.body.secret, req.body.mfaCode);
            if(!verified) {
                res.error("BAD_REQUEST", "2FA-Code is invalid.");
                return;
            }
            req.user.mfa_secret = req.body.secret;
            req.user.mfa = true;
            try {
                await req.user.save();
            } catch(e) {
                next(e);
                return;
            }

            res.noContent(); //Sends 204
            return;
        } else if(req.body.status === "disable") {
            req.user.mfa = false;
            req.user.mfa_secret = "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
            try {
                await req.user.save();
            } catch(e) {
                next(e);
                return;
            }

            res.noContent(); //Sends 204
            return;
        } else {
            res.error("BAD_REQUEST", "Invalid status.");
            return;
        }
    } else {
        res.error("BAD_REQUEST", "Missing status.");
        return;
    }
});

router.get("/data", async (req, res, next) => {

    if(req.user.mfa) {
        res.status(200).json({
            "status": "enabled"
        });
        return;
    }

    let secret = Node2FA.generateSecret({name: config.ui.globalPlaceholder.serviceName, account: req.user.username});
    let qrCode = await qrcode.toDataURL(secret.uri, {
        type: "image/webp",
        errorCorrectionLevel: "high",
        scale: 4,
        margin: 0,
        color: {dark: "", light: "#00000000"}
    });

    res.status(200).json({
        "status": "disabled",
        "secret": secret.secret,
        "qrCodeURL": qrCode
    });

});

//All other methods not allowed
router.all("/", (req, res, next) => {
    res.error("METHOD_NOT_ALLOWED", "This method is not allowed for this resource.", {allowedMethods: ["POST"] });
});
