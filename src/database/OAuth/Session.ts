import crypto from "crypto";
import * as db from "../Database";

export type UserSession = {
    sessionId: string,
    sessionUser: string,
    sessionExpires: number,
    created: number,
    updated: number,
    sessionData: {
        [key: string]: string
    }
}

export async function generate(userId: string): Promise<string> {
    let sessionId = crypto.randomUUID();
    let response = await db.update("INSERT INTO UserSession (sessionId, sessionUser) VALUES (?, ?)", [sessionId, userId]);
    if(response.error) {
        throw new Error(response.error_message);
    }
    return sessionId;
}

export async function isValid(sessionId : string): Promise<boolean> {
    let response = await db.query("SELECT * FROM UserSession WHERE sessionId = ? AND sessionExpires >= (current_timestamp)", [sessionId]);
    if(response.error) {
        throw new Error(response.error_message);
    }
    return response.rows.length > 0;

}

export async function get(sessionId: string): Promise<UserSession|null> {
    let response = await db.query("SELECT * FROM UserSession WHERE sessionId = ? AND sessionExpires >= (current_timestamp)", [sessionId]);
    if(response.error) {
        throw new Error(response.error_message);
    }
    if(response.rows.length === 0) {
        return null;
    }
    let ret : UserSession = {
        sessionId: response.rows[0].sessionId,
        sessionUser: response.rows[0].sessionUser,
        sessionExpires: response.rows[0].sessionExpires,
        created: response.rows[0].created,
        updated: response.rows[0].updated,
        sessionData: {}
    }
    let storeResponse = await db.query("SELECT * FROM UserSessionStore WHERE sessionId = ?", [sessionId]);
    if(storeResponse.error) {
        throw new Error(storeResponse.error_message);
    }
    for(let i = 0; i < storeResponse.rows.length; i++) {
        ret.sessionData[storeResponse.rows[i].key] = storeResponse.rows[i].value;
    }
    return ret;
}

export async function remove(sessionId: string): Promise<void> {
    let response = await db.update("DELETE FROM UserSession WHERE sessionId = ?", [sessionId]);
    if(response.error) {
        throw new Error(response.error_message);
    }
}

export async function setValue(sessionId: string, key: string, value: string): Promise<void> {
    let response = await db.update("INSERT INTO UserSessionStore (sessionId, storeKey, storeValue) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE storeValue=VALUES(storeValue)", [sessionId, key, value]);
    if(response.error) {
        throw new Error(response.error_message);
    }
}

export async function getValue(sessionId: string, key: string): Promise<string|null> {
    let response = await db.query("SELECT storeValue FROM UserSessionStore WHERE sessionId = ? AND storeKey = ?", [sessionId, key]);
    if(response.error) {
        throw new Error(response.error_message);
    }
    if(response.rows.length === 0) {
        return null;
    }
    return response.rows[0].storeValue;
}

export async function cleanupSessions(): Promise<void> {
    let response = await db.update("DELETE FROM UserSession WHERE sessionExpires < (current_timestamp)", []);
    if(response.error) {
        throw new Error(response.error_message);
    }
}
