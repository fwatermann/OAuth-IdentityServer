import express from "express";
import {BAD_REQUEST, NOT_FOUND, UNAUTHORIZED} from "../../errors";
import * as OAuth from "../../database/OAuthDB";
import {OAuthClient} from "../../database/OAuth/Client";
import config from "../../config/config.json";

const router = express.Router();
export default router;

router.get("/validate", async(req, res, next) => {

    if(req.headers.authorization) {
        let token = req.headers.authorization;
        if(!token.startsWith("Bearer ")) {
            res.send(401).json(UNAUTHORIZED("Invalid token", "The provided token is invalid. (Prefix must be \"Bearer\")"));
            return;
        }
        token = token.split(" ", 2)[1];
        if(!token) {
            res.send(401).json(UNAUTHORIZED("Invalid token", "The token provided in authorization header is invalid."));
            return;
        }
        let oauthToken = await OAuth.Token.get(token);
        console.log(`Token: "${token}"`);
        if(!oauthToken || oauthToken.expires < Date.now()) {
            res.status(401).json(UNAUTHORIZED("Invalid token", "The token provided in authorization header is invalid."));
            return;
        }
        res.status(200).json({
            client_id: oauthToken.clientId,
            scopes: oauthToken.scope,
            userId: oauthToken.userId,
            expires_at: oauthToken.expires
        });
    } else {
        res.status(400).json(BAD_REQUEST("Bad request", "Token must be provided in authorization header!"));
        return;
    }

});

router.post("/", async (req, res, next) => {

    if(req.headers["content-type"] != "application/x-www-form-urlencoded") {
        res.status(400).json(BAD_REQUEST("Invalid content type.", "The request should be sent in \"application/x-www-form-urlencoded\" format."));
        return;
    }

    let client_id = req.body.client_id;
    let client_secret = req.body.client_secret;
    let grant_type = req.body.grant_type;

    if(!client_id || !client_secret || !grant_type) {
        res.status(400).json(BAD_REQUEST("Missing parameters.", "The request is missing some parameters."));
        return;
    }

    let client;
    try {
        client = await OAuth.Client.get(client_id);
    } catch(e) {
        next(e);
    }

    if(!client) {
        res.status(400).json(BAD_REQUEST("Invalid client.", "The client is not registered."));
        return;
    }
    if(client.clientSecret != client_secret) {
        res.status(401).json(UNAUTHORIZED("Invalid client secret.", "The client secret is invalid."));
        return;
    }

    if(grant_type == "authorization_code") {
        await handleAuthCodeRequest(req, res, next, client);
        return;
    } else if(grant_type == "refresh_token") {
        await handleRefreshTokenRequest(req, res, next, client);
        return;
    } else {
        res.status(400).json(BAD_REQUEST("Invalid grant type.", "The grant type is not supported. On this endpoint response_type must be \"authorization_code\" or \"refresh_token\" !"));
        return;
    }

});

async function handleAuthCodeRequest(req: express.Request, res: express.Response, next: express.NextFunction, client: OAuthClient) {

    try {

        let code = req.body.code;
        let redirect_uri = req.body.redirect_uri;

        let authCode = await OAuth.AuthCode.get(code);
        if (!authCode) {
            res.status(400).json(BAD_REQUEST("Invalid authorization code.", "The authorization code is invalid."));
            return;
        }

        if(authCode.clientId != client.clientId) {
            res.status(401).json(UNAUTHORIZED("Client mismatch", "The provided authorization code was issued to a different client."))
        }

        if (authCode.redirectURI != redirect_uri) {
            res.status(400).json(BAD_REQUEST("Invalid redirect uri.", "The provided redirect uri does not match the provided authorization code."));
            return;
        }

        let token = await OAuth.Token.create("userAccess", authCode.scopes, client.clientId, authCode.userId);
        let refreshToken = await OAuth.Token.create("userRefresh", authCode.scopes, client.clientId, authCode.userId);

        if (!token || !refreshToken) {
            if (token) await OAuth.Token.deleteToken(token.token);
            if (refreshToken) await OAuth.Token.deleteToken(refreshToken.token);
            res.status(500).json(BAD_REQUEST("Internal server error.", "An internal server error occurred while creating the token."));
            return;
        }

        await OAuth.AuthCode.deleteAuthCode(code);

        res.status(200).json({
            access_token: token.token,
            token_type: "Bearer",
            expires_in: token.expires,
            refresh_token: refreshToken.token,
            scope: token.scope
        });

    } catch(e) {
        next(e);
    }

}

async function handleRefreshTokenRequest(req: express.Request, res: express.Response, next: express.NextFunction, client: OAuthClient) {

    let refreshTokenStr = req.body.refresh_token;

    if (!refreshTokenStr) {
        res.status(400).json(BAD_REQUEST("Invalid request.", "The refresh token field is missing in the request.", {request: req.body}));
        return;
    }
    let oauth_token = await OAuth.Token.get(refreshTokenStr);
    if (!oauth_token) {
        res.status(404).json(NOT_FOUND("Token not found", "The provided token does not exist."));
        return;
    }

    if (oauth_token.clientId != client.clientId) {
        res.status(401).json(UNAUTHORIZED("Client mismatch", "The provided refresh token was issued to a different client."));
        return;
    }

    let relations = await OAuth.Token.getRelationshipCount(oauth_token.tokenId);

    if (relations >= config.oauth.tokens.maxTokensPerRefreshToken) {
        res.status(400).json(BAD_REQUEST("Token invalid", "The provided refresh token has become invalid due to too many refresh requests."))
        return;
    }

    /* Token OK */

    let token = await OAuth.Token.create("userAccess", oauth_token.scope, client.clientId, oauth_token.userId, oauth_token.tokenId);
    let refreshToken = await OAuth.Token.create("userRefresh", oauth_token.scope, client.clientId, oauth_token.userId);

    if (!token || !refreshToken) {
        if (token) await OAuth.Token.deleteToken(token.token);
        if (refreshToken) await OAuth.Token.deleteToken(refreshToken.token);
        res.status(500).json(BAD_REQUEST("Internal server error.", "An internal server error occurred while creating the token."));
        return;
    }

    res.status(200).json({
        access_token: token.token,
        token_type: "Bearer",
        expires_in: token.expires,
        refresh_token: refreshToken.token,
        scope: token.scope
    });


}
