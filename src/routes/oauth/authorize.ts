import express from "express";
import crypto from "crypto";
import template from "../templates";
import config from "../../config/config.json";
import * as OAuth from "../../database/OAuthDB";
import {Encoding} from "crypto";
import {OAuth__Scope} from "../../database/Database";

const router = express.Router();
export default router;

router.get("/", async (req, res, next) => {

    if(!(req as any).session) {
        res.redirect("/login?redirect_uri=" + encodeURIComponent(req.originalUrl));
        return;
    }

    let client_id = req.query.client_id;
    let redirect_uri = req.query.redirect_uri;
    let response_type = req.query.response_type;
    let scope = req.query.scope;
    let state = req.query.state;
    let force_verify = req.query.force_verify;

    if(!client_id || !redirect_uri || !response_type || !scope) {
        res.error("BAD_REQUEST", "Missing parameters in authorization request.", {
            client_id: client_id??false,
            redirect_uri: redirect_uri??false,
            response_type: response_type??false,
            scope: scope??false,
            state: state??false,
            force_verify: force_verify??false,
        });
        return;
    }

    if(response_type != "code" && response_type != "token") {
        res.error("BAD_REQUEST", "Invalid response type.");
        return;
    }
    if(!scope || (scope as string) == "") {
        res.error("BAD_REQUEST", "Invalid scope.");
        return;
    }

    let client = await OAuth.Client.get(client_id as string);
    if(client == null) {
        res.error("BAD_REQUEST", "Provided client_id is invalid.");
        return;
    }
    let user = await OAuth.User.get((req as any).session.sessionUser);
    if(user == null) {
        res.error("UNAUTHORIZED", "Not logged in.");
        return;
    }

    if(client.trusted) {
        if(!(await OAuth.Client.checkRedirectURI(client.clientId, redirect_uri as string))) {
            res.error("BAD_REQUEST", "Set redirect_uri is not registered.");
            return;
        }

        if(response_type == "code") {
            await answerWithAuthCode(res, scope as string, redirect_uri as string, client.clientId, user.userId, state as string|undefined);
            return;
        } else if(response_type == "token") {
            await answerWithToken(res, scope as string, redirect_uri as string, client.clientId, user.userId, state as string|undefined);
            return;
        } else {
            res.error("BAD_REQUEST", "Provided response type is invalid. Use either \"code\" for Authorization Code Flow or \"token\" for Implicit Grant Flow.");
            return;
        }

        //TODO: Skip authorization and redirect to redirect_uri with requested response type.
    }

    let scopes = (scope as string).split(" ");
    let scopesDescriptions : (OAuth__Scope|null)[] = [];
    for(let i = 0; i < scopes.length; i++) {
        let scope = scopes[i];
        let scopeInfo = (await OAuth.Token.getScopeInfo(scope))?.toJSON() as OAuth__Scope;
        if(scopeInfo) scopesDescriptions.push(scopeInfo);
        else scopesDescriptions.push(undefined);
    }

    let jokeScope = config.ui.oauth.authorize.showJokeScope ? [config.ui.oauth.authorize.jokeScopes[Math.floor(Math.random() * config.ui.oauth.authorize.jokeScopes.length)]] : [];

    template("authorize.html", {
        clientName: client.clientName,
        clientIconURL: "https://cdn.w-mi.de/shorturl/images/program.png",
        clientActiveSince: new Date(client.createdAt).toDateString(),
        userDisplayName: user.displayName,
        userIconURL: "https://cdn.w-mi.de/shorturl/images/user.png",
        scopesDescriptions: scopesDescriptions,
        jokeScopes: jokeScope,

        csrf: generateCSRFToken(),
        client_id: client.clientId,
        redirect_uri: redirect_uri as string,
        response_type: response_type as string,
        scope: scope as string,
        state: (state??"") as string,
    }, req, res, next);
});

router.post("/", async (req, res) => {

    if(req.headers["content-type"] != "application/x-www-form-urlencoded") {
        res.error("UNSUPPORTED_MEDIA_TYPE", "Content-Type of request must be \"application/x-www-form-urlencoded\".");
        return;
    }

    if(!req.user || !req.loggedIn) {
        res.redirect("/login?redirect_uri=" + encodeURIComponent(req.originalUrl));
        return;
    }

    let csrf = req.body.csrf;
    let cancel = req.body.cancel;
    let client_id = req.body.client_id;
    let redirect_uri = req.body.redirect_uri;
    let response_type = req.body.response_type;
    let scope = req.body.scope;
    let state = req.body.state;

    if(!client_id || !redirect_uri || !response_type || !scope) {
        res.error("BAD_REQUEST", "Missing parameters in authorization request.", {
            client_id: client_id??false,
            redirect_uri: redirect_uri??false,
            response_type: response_type??false,
            scope: scope??false,
            state: state??false,
        })
        return;
    }

    let client = await OAuth.Client.get(client_id as string);
    if(!client) {
        res.error("BAD_REQUEST", "Provided client_id is invalid.");
        return;
    }

    let user = req.user;

    if(!(await OAuth.Client.checkRedirectURI(client.clientId, redirect_uri as string))) {
        res.error("BAD_REQUEST", "Set redirect_uri is not a registered redirect uri.");
        return;
    }

    if(!checkCSRFToken(csrf)) {
        res.error("BAD_REQUEST", "Invalid CSRF-Token.");
        return;
    }

    if(cancel == "cancel") {
        res.redirect(redirect_uri as string + "?error=access_denied&state=" + encodeURIComponent(state as string));
        return;
    }

    if(response_type == "code") {
        await answerWithAuthCode(res, scope as string, redirect_uri as string, client.clientId, user.userId, state as string|undefined);
        return;
    } else if(response_type == "token") {
        await answerWithToken(res, scope as string, redirect_uri as string, client.clientId, user.userId, state as string|undefined);
        return;
    } else {
        res.error("BAD_REQUEST", "Provided response type is invalid. Use either \"code\" for Authorization Code Flow or \"token\" for Implicit Grant Flow.")
        return;
    }
});

router.all("/", (req, res, next) => {
    res.error("METHOD_NOT_ALLOWED", `This endpoint does not support "${req.method}"`);
    return;
});

function generateCSRFToken() : string {
    let token = {
        token: crypto.randomBytes(32).toString("hex"),
        secret: config.secret.csrf_secret
    };
    let tokenString = JSON.stringify(token);

    let algorithm = "aes256"
    let inputEncoding : Encoding = "utf8";
    let outputEncoding : Encoding = "hex";
    let ivLength = 16;

    let key = Buffer.from(config.secret.csrf_token, "latin1");
    let iv = crypto.randomBytes(ivLength);

    let cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(tokenString, inputEncoding, outputEncoding);
    encrypted += cipher.final(outputEncoding);
    return iv.toString(outputEncoding) + ":" + encrypted;
}

function checkCSRFToken(token: string) : boolean {

    try {
        let algorithm = "aes256";
        let inputEncoding : Encoding = "utf8";
        let outputEncoding : Encoding = "hex";
        let ivLength = 16;
        let key = Buffer.from(config.secret.csrf_token, "latin1");

        let components = token.split(":");
        let iv = Buffer.from(components.shift() as string, outputEncoding);
        let decipher = crypto.createDecipheriv(algorithm, key, iv);
        let deciphered = decipher.update(components.join(":"), outputEncoding, inputEncoding);
        deciphered += decipher.final(inputEncoding);

        let tokenObject = JSON.parse(deciphered);
        if(tokenObject.secret != config.secret.csrf_secret) {
            return false;
        }

    } catch(e) {
        console.error(e);
        return false;
    }

    return true;
}

async function answerWithToken(res: express.Response, scopes: string|string[], redirectURI: string, clientId: string, userId: string, state?: string) {
    let scope : string = Array.isArray(scopes) ? scopes.join(";") : scopes;
    let token = await OAuth.Token.create("userAccess", (scope as string).split(" "), clientId, userId);
    if (token == null) {
        res.error("INTERNAL_SERVER_ERROR", "Failed to create access token.");
        return;
    }
    res.redirect(redirectURI as string + "#access_token=" + token.token + "&token_type=bearer&expires_in=14400" + (state ? "&state=" + encodeURIComponent(state as string) : ""));
    return;

}

async function answerWithAuthCode(res : express.Response, scopes: string|string[], redirect_uri: string, clientId: string, userId: string, state?: string) {
    let scope : string = Array.isArray(scopes) ? scopes.join(";") : scopes;

    let code = await OAuth.AuthCode.create(scope.split(" "), redirect_uri, clientId, userId);
    if(code == null) {
        res.error("INTERNAL_SERVER_ERROR", "Failed to create authorization code.")
        return;
    }
    res.redirect(redirect_uri as string + "?code=" + code.authCode + (state ? "&state=" + encodeURIComponent(state as string) : ""));
    return;
}

