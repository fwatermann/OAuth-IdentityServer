import crypto from "crypto";
import * as db from "../Database";
import OAuth__User from "../models/OAuth.User.model";

export type OAuthUser = {
    userId: string,
    username: string,
    displayName: string,
    passwordHash: string,
    email: string,
    mfa: boolean,
    mfa_secret?: string,
    permissions: any,
    created: number,
    updated: number
}

export async function create(username: string, displayName: string, password: string, email: string): Promise<string> {
    let passwordHash = hashPassword(username, password);
    let userId = crypto.randomUUID();
    let response = await OAuth__User.create({
        userId: userId,
        username: username,
        displayName: displayName,
        password: passwordHash,
        email: email
    });
    return response.userId;
}

export async function get(userId: string) : Promise<OAuthUser|null> {
    let response = await OAuth__User.findByPk(userId);
    return response;
}

export async function checkPassword(username: string, password: string): Promise<boolean> {
    let passwordHash = hashPassword(username, password);

}

export async function update2FA(userId: string, enabled: boolean, secret?: string) {
    let response = await db.update("UPDATE OAuth__User SET `mfa` = ?, `mfa_secret` = ? WHERE `userId` = ?", [enabled ? 1 : 0, secret??"2FA-DISABLED", userId]);
    if(response.error) {
        throw new Error(response.error_message);
    }
}

export function hashPassword(username : string, password : string) : string {
    const salt = crypto.createHash("sha256").update(username.toLowerCase().trim() + password).digest("hex");
    return crypto.createHash("sha256").update(salt + password).digest("hex");
}
