import * as db from "../Database";
import * as crypto from "crypto";
import config from "../../config/config.json";

export type OAuthToken = {
    tokenId: string,
    refreshTokenId?: string,
    token: string,
    type: OAuthTokenType,
    expires: number,
    scope: string[],
    clientId: string,
    userId: string,
    created?: number,
    updated?: number
}

export type OAuthTokenType = "userAccess" | "clientAccess" | "userRefresh";

export type OAuthTokenScopeInfo = {
    name: string,
    description: string,
}

export async function create(type: OAuthTokenType, scope: string[], clientId: string, userId: string, refreshToken?: string): Promise<OAuthToken|null> {
    let tokenId = crypto.randomUUID();
    let token = crypto.randomBytes(16).toString("hex");
    let scopes = scope.join(";");

    let response = await db.update(`INSERT INTO OAuth__Tokens (tokenId, token, tokenType, tokenScope, tokenClient, tokenUser${refreshToken ? ", refreshToken" : ""}) VALUES (?, ?, ?, ?, ?, ?${refreshToken?", ?":""})`, [tokenId, token, type, scopes, clientId, userId].concat(refreshToken?[refreshToken]:[]));
    if(response.error) {
        throw new Error(response.error_message);
    }
    return {
        tokenId: tokenId,
        refreshTokenId: refreshToken,
        token: token,
        type: type,
        expires: 4 * 60 * 60,
        scope: scope,
        clientId: clientId,
        userId: userId
    };
}

export async function get(token: string) : Promise<OAuthToken|null> {
    let response = await db.query("SELECT * FROM OAuth__Tokens WHERE token = ?", [token]);
    if(response.error) {
        throw new Error(response.error_message);
    }
    if(response.rows.length === 0) {
        return null;
    }
    return {
        tokenId: response.rows[0].tokenId,
        refreshTokenId: response.rows[0].refreshToken,
        token: response.rows[0].token,
        type: response.rows[0].tokenType,
        expires: response.rows[0].tokenExpires,
        scope: response.rows[0].tokenScope.split(";"),
        clientId: response.rows[0].tokenClient,
        userId: response.rows[0].tokenUser,
        created: response.rows[0].created,
        updated: response.rows[0].updated
    }
}

export async function deleteToken(token: string) : Promise<boolean> {
    let response = await db.update("DELETE FROM OAuth__Tokens WHERE token = ?", [token]);
    if(response.error) {
        throw new Error(response.error_message);
    }
    return true;
}

export async function cleanupExpired() : Promise<boolean> {
    let response = await db.update("DELETE FROM OAuth__Tokens WHERE tokenExpires < CURRENT_TIMESTAMP", []);
    if(response.error) {
        throw new Error(response.error_message);
    }
    return true;
}

export function getScopeInfo(scope : string): OAuthTokenScopeInfo|null {
    if(config.oauth.scopes.hasOwnProperty(scope)) {
        return (config.oauth.scopes as any)[scope];
    } else {
        return null;
    }
}

export async function getRelationshipCount(refreshTokenId: string): Promise<number> {

    let response = await db.query("SELECT COUNT(*) as anzahl FROM OAuth__Tokens WHERE `refreshToken` = ?;", [refreshTokenId]);
    if(response.error) {
        throw new Error(response.error_message);
    }
    if(response.rows.length <= 0) return 0;

    return response.rows[0].anzahl as number;

}
