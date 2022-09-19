import * as db from "../Database";
import * as crypto from "crypto";

export type OAuthCode = {
    authCodeId: string,
    authCode: string,
    redirectURI: string,
    expires: number,
    scopes: string[],
    clientId: string,
    userId: string,
    created?: number,
    updated?: number
}

export async function create(scope: string[], redirectURI: string, clientId: string, userId: string): Promise<OAuthCode|null> {
    let authCodeId = crypto.randomUUID();
    let authCode = crypto.randomBytes(16).toString("hex");
    let scopes = scope.join(";");

    let response = await db.update("INSERT INTO OAuth__AuthCodes (authCodeId, authCode, authCodeRedirectURI, authCodeScope, authCodeClient, authCodeUser) VALUES (?, ?, ?, ?, ?, ?)", [authCodeId, authCode, redirectURI, scopes, clientId, userId]);
    if(response.error) {
        throw new Error(response.error_message);
    }
    return {
        authCodeId: authCodeId,
        authCode: authCode,
        redirectURI: redirectURI,
        expires: 0,
        scopes: scope,
        clientId: clientId,
        userId: userId
    };
}

export async function get(authCode: string) : Promise<OAuthCode|null> {
    let response = await db.query("SELECT * FROM OAuth__AuthCodes WHERE authCode = ?", [authCode]);
    if(response.error) {
        throw new Error(response.error_message);
    }
    if(response.rows.length === 0) {
        return null;
    }
    return {
        authCodeId: response.rows[0].authCodeId,
        authCode: response.rows[0].authCode,
        redirectURI: response.rows[0].authCodeRedirectURI,
        expires: response.rows[0].authCodeExpires,
        scopes: response.rows[0].authCodeScope.split(";"),
        clientId: response.rows[0].authCodeClient,
        userId: response.rows[0].authCodeUser,
        created: response.rows[0].created,
        updated: response.rows[0].updated
    }
}

export async function deleteAuthCode(authCode: string) : Promise<boolean> {
    let response = await db.update("DELETE FROM OAuth__AuthCodes WHERE authCode = ?", [authCode]);
    if(response.error) {
        throw new Error(response.error_message);
    }
    return true;
}

export async function cleanupExpired() : Promise<boolean> {
    let response = await db.update("DELETE FROM OAuth__AuthCodes WHERE authCodeExpires < CURRENT_TIMESTAMP", []);
    if(response.error) {
        throw new Error(response.error_message);
    }
    return true;
}
