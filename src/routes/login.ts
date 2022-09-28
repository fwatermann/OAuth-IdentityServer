import express from "express";
import template from "./templates";
import * as OAuthDB from "../database/OAuthDB";
import * as Errors from "../errors";
import config from "../config/config.json";
import {METHOD_NOT_ALLOWED} from "../errors";
import {Session} from "../types/Session";
import crypto from "crypto";
const node2fa = require("node-2fa");

const router = express.Router();
export default router;

router.get("/", async (req, res, next) => {
    if(req.session && req.user) {
        res.redirect((req.query.redirect_uri as string)??config.ui.login_redirect);
        return;
    }
    template("login.html", {username: "", logo_url: config.ui.logo_url}, req, res, next);
});

router.post("/", async (req, res, next) => {
    try {
        if(!req.body.username) {
            res.status(400).send(Errors.BAD_REQUEST("Missing username.", "No username was provided in the request body"));
            return;
        }
        if(!req.body.password) {
            res.status(400).send(Errors.BAD_REQUEST("Missing password.", "No password was provided in the request body"));
            return;
        }
        let username = req.body.username as string;
        let password = req.body.password as string;

        let user = await OAuthDB.User.getByUsername(username);
        if(user === null) {
            res.status(401).send(Errors.UNAUTHORIZED("Invalid username or password.", "The username or password provided is incorrect."));
            return;
        }
        let checkPassword = OAuthDB.User.hashPassword(username, password) === user.password;
        if(!checkPassword) {
            res.status(401).send(Errors.UNAUTHORIZED("Invalid username or password.", "The username or password provided is incorrect."));
            return;
        }

        if(user.mfa && !req.body.totp) {
            res.status(200).json({
                ok: true,
                redirect_uri: (req.query.redirect_uri as string)??config.ui.login_redirect,
                mfa: true
            });
            return;
        }

        if(user.mfa && user.mfa_secret && req.body.totp) {
            let response = node2fa.verifyToken(user.mfa_secret, req.body.totp as string, 2);
            if(!response || Math.abs(response.delta) > 2) {
                res.status(401).json({
                    ok: false,
                    mfa: true
                });
                return;
            }
        }


        let session : Session = {
            sessionId: crypto.randomUUID(),
            sessionData: {},
            sessionExpires: Date.now() + 1000 * 60 * 60 * 24 * 7, //7 Days
            sessionUser: user.userId
        }
        res.cookie(config.session.cookie.name, JSON.stringify(session), {
            signed: true,
            httpOnly: true,
            path: "/",
            sameSite: "lax",
            encode: (val): string => {
                return Buffer.from(val, "utf8").toString("base64");
            }
        });

        res.status(200).json({
            ok: true,
            redirect_uri: (req.query.redirect_uri as string)??config.ui.login_redirect
        });
        return;
    } catch(e) {
        next(e);
    }

});

router.all("/", (req, res, next) => {
    res.status(405).json(METHOD_NOT_ALLOWED("Invalid request method for this endpoint.", undefined, ["GET", "POST"]));
});


