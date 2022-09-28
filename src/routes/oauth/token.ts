import express from "express";
import * as OAuth from "../../database/OAuthDB";
import config from "../../config/config.json";
import {OAuth__Client} from "../../database/Database";

const router = express.Router();
export default router;

router.get("/validate", async(req, res, next) => {

    if(req.headers.authorization) {
        let token = req.headers.authorization;
        if(!token.startsWith("Bearer ")) {
            res.error("UNAUTHORIZED", "The provided token is invalid. Token prefix must be \"Bearer\".");
            return;
        }
        token = token.split(" ", 2)[1];
        if(!token) {
            res.error("UNAUTHORIZED", "The provided access token is invalid.");
            return;
        }
        let oauthToken = await OAuth.Token.get(token);
        console.log(`Token: "${token}"`);
        if(!oauthToken || oauthToken.tokenExpires.getTime() < Date.now()) {
            res.error("UNAUTHORIZED", "The provided access token is invalid.");
            return;
        }
        res.status(200).json({
            client_id: oauthToken.clientId,
            scopes: oauthToken.tokenScopes,
            userId: oauthToken.userId,
            expires_at: oauthToken.tokenExpires.toISOString(),
            expires_in: Math.round((oauthToken.tokenExpires.getTime() - Date.now()) / 1000)
        });
    } else {
        res.error("BAD_REQUEST", "Token mus be provided in authorization header!");
        return;
    }

});

router.post("/", async (req, res, next) => {

    if(req.headers["content-type"] != "application/x-www-form-urlencoded") {
        res.error("UNSUPPORTED_MEDIA_TYPE", "The request should be sent in \"application/x-www-form-urlencoded\" format.");
        return;
    }

    let client_id = req.body.client_id;
    let client_secret = req.body.client_secret;
    let grant_type = req.body.grant_type;

    if(!client_id || !client_secret || !grant_type) {
        res.error("BAD_REQUEST", "The request is missing some parameters.");
        return;
    }

    let client;
    try {
        client = await OAuth.Client.get(client_id);
    } catch(e) {
        next(e);
    }

    if(!client) {
        res.error("BAD_REQUEST", "The client is not registered.");
        return;
    }
    if(client.clientSecret != client_secret) {
        res.error("UNAUTHORIZED", "Invalid client secret.");
        return;
    }

    if(grant_type == "authorization_code") {
        await handleAuthCodeRequest(req, res, next, client);
        return;
    } else if(grant_type == "refresh_token") {
        await handleRefreshTokenRequest(req, res, next, client);
        return;
    } else {
        res.error("BAD_REQUEST", "The grant type is not supported. On this endpoint response_type must be \"authorization_code\" or \"refresh_token\" !");
        return;
    }

});

router.all("/", (req, res, next) => {
    res.error("METHOD_NOT_ALLOWED", `This endpoint does not support "${req.method}"`);
});

router.all("/validate", (req, res, next) => {
    res.error("METHOD_NOT_ALLOWED", `This endpoint does not support "${req.method}"`);
});

async function handleAuthCodeRequest(req: express.Request, res: express.Response, next: express.NextFunction, client: OAuth__Client) {

    try {

        let code = req.body.code;
        let redirect_uri = req.body.redirect_uri;

        let authCode = await OAuth.AuthCode.get(code);
        console.log(authCode.toJSON());
        console.log("redirectURI: " + redirect_uri);
        if (!authCode) {
            res.error("BAD_REQUEST", "The authorization code is invalid.");
            return;
        }

        if(authCode.clientId != client.clientId) {
            res.error("UNAUTHORIZED", "The provided authorization code was issued to a different client.");
        }

        if (authCode.redirectURI?.redirectURI != redirect_uri) {
            res.error("BAD_REQUEST", "The provided redirect uri does not match the provided authorization code.");
            return;
        }

        let token = await OAuth.Token.create("userAccess", authCode.authCodeScopes.map<string>((obj) => obj.scope), client.clientId, authCode.userId);
        let refreshToken = await OAuth.Token.create("userRefresh", authCode.authCodeScopes.map<string>((obj) => obj.scope), client.clientId, authCode.userId);

        if (!token || !refreshToken) {
            if (token) await OAuth.Token.deleteToken(token.token);
            if (refreshToken) await OAuth.Token.deleteToken(refreshToken.token);
            res.error("INTERNAL_SERVER_ERROR", "An internal server error occurred while creating the token.");
            return;
        }

        await OAuth.AuthCode.deleteAuthCode(code);

        console.log(token);

        res.status(200).json({
            access_token: token.token,
            token_type: "Bearer",
            expires_in: 4*60*60,
            refresh_token: refreshToken.token,
            scope: authCode.authCodeScopes.map<string>((obj) => obj.scope)
        });

    } catch(e) {
        next(e);
    }

}

async function handleRefreshTokenRequest(req: express.Request, res: express.Response, next: express.NextFunction, client: OAuth__Client) {

    let refreshTokenStr = req.body.refresh_token;

    if (!refreshTokenStr) {
        res.error("BAD_REQUEST", "The refresh token field is missing in the request.", {request: req.body})
        return;
    }
    let oauth_token = await OAuth.Token.get(refreshTokenStr);
    if (!oauth_token) {
        res.error("NOT_FOUND", "The provided token does not exist.")
        return;
    }

    if (oauth_token.clientId != client.clientId) {
        res.error("UNAUTHORIZED", "The provided refresh token was issued to a different client.")
        return;
    }

    let relations = await OAuth.Token.getRelationshipCount(oauth_token.tokenId);

    if (relations >= config.oauth.tokens.maxTokensPerRefreshToken) {
        res.error("BAD_REQUEST", "The provided refresh token has become invalid due to too many refresh requests.")
        return;
    }

    /* Token OK */

    let token = await OAuth.Token.create("userAccess", oauth_token.tokenScopes.map<string>((obj) => obj.scope), client.clientId, oauth_token.userId, oauth_token.tokenId);
    let refreshToken = await OAuth.Token.create("userRefresh", oauth_token.tokenScopes.map<string>((obj) => obj.scope), client.clientId, oauth_token.userId);

    if (!token || !refreshToken) {
        if (token) await OAuth.Token.deleteToken(token.token);
        if (refreshToken) await OAuth.Token.deleteToken(refreshToken.token);
        res.error("INTERNAL_SERVER_ERROR", "An internal server error occurred while creating the token.")
        return;
    }

    res.status(200).json({
        access_token: token.token,
        token_type: "Bearer",
        expires_in: Math.round((token.tokenExpires.getTime() - Date.now()) / 1000),
        refresh_token: refreshToken.token,
        scope: token.tokenScopes.map<string>((obj) => obj.scope)
    });


}
