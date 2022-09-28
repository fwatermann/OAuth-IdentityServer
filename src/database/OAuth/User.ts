import crypto from "crypto";
import {ASSOCIATION_OAuth__User_UserPermission, OAuth__User} from "../Database";

export async function create(username: string, displayName: string, password: string, email: string): Promise<OAuth__User|null> {
    let passwordHash = hashPassword(username, password);
    let userId = crypto.randomUUID();
    return await OAuth__User.create({
        userId: userId,
        username: username,
        displayName: displayName,
        password: passwordHash,
        email: email,
        mfa: false
    });
}

export async function get(userId: string) : Promise<OAuth__User|null> {
    return await OAuth__User.findByPk(userId, {
        include: [
            {
                association: ASSOCIATION_OAuth__User_UserPermission,
                nested: true,
                attributes: ["permission"]
            }
        ]
    });
}

export async function getByUsername(username: string): Promise<OAuth__User|null> {
    return await OAuth__User.findOne({
        where: {
            username: username
        }
    });
}

export async function checkPassword(username: string, password: string): Promise<boolean> {
    let passwordHash = hashPassword(username, password);
    return (await OAuth__User.findOne({
        where: {
            username: username,
            password: passwordHash
        }
    })) != null;
}

export async function update2FA(userId: string, enabled: boolean, secret?: string) {
    await OAuth__User.update({mfa: enabled, mfa_secret: secret}, {
        where: {
            userId: userId
        }
    });
}

export function hashPassword(username : string, password : string) : string {
    const salt = crypto.createHash("sha256").update(username.toLowerCase().trim() + password).digest("hex");
    return crypto.createHash("sha256").update(salt + password).digest("hex");
}
