import crypto from "crypto";
import * as db from "../Database";

export type OAuthUser = {
    userId: string,
    username: string,
    displayName: string,
    passwordHash: string,
    email: string,
    created: number,
    updated: number
}

export async function create(username: string, displayName: string, password: string, email: string): Promise<string> {
    let passwordHash = hashPassword(username, password);
    let userId = crypto.randomUUID();
    let response = await db.update("INSERT INTO OAuth__User (userId, username, displayName, password, email) VALUES (?, ?, ?, ?, ?)", [userId, username, displayName, passwordHash, email]);
    if(response.error) {
        throw new Error(response.error_message);
    }
    return userId;
}

export async function get(userId: string) : Promise<OAuthUser|null> {
    let response = await db.query("SELECT * FROM OAuth__User WHERE userId = ? OR username = ?", [userId, userId]);
    if(response.error) {
        throw new Error(response.error_message);
    }
    if(response.rows.length === 0) {
        return null;
    }
    return {
        userId: response.rows[0].userId,
        username: response.rows[0].username,
        displayName: response.rows[0].displayName,
        passwordHash: response.rows[0].password,
        email: response.rows[0].email,
        created: response.rows[0].created,
        updated: response.rows[0].updated
    }
}

export async function checkPassword(username: string, password: string): Promise<boolean> {
    let passwordHash = hashPassword(username, password);
    let response = await db.query("SELECT password FROM OAuth__User WHERE username = ?", [username]);
    if(response.error) {
        throw new Error(response.error_message);
    } else {
        if(response.rows.length === 0) return false;
        return response.rows[0].password === passwordHash;
    }
}

export function hashPassword(username : string, password : string) : string {
    const salt = crypto.createHash("sha256").update(username.toLowerCase().trim() + password).digest("hex");
    return crypto.createHash("sha256").update(salt + password).digest("hex");
}
