import * as db from "../Database";
import {
    OAuth__AuthCode,
    ASSOCIATION_OAuth__AuthCode_Scope,
    ASSOCIATION_OAuth__AuthCode_Client,
    ASSOCIATION_OAuth__AuthCode_User,
    OAuth__ClientURI, OAuth__Scope, OAuth__AuthCodeScope, ASSOCIATION_OAuth__Client_URI, ASSOCIATION_OAuth__AuthCode_URI
} from "../Database";
import * as crypto from "crypto";
import sequelize, {Op} from "sequelize";

export async function create(scope: string[], redirectURI: string, clientId: string, userId: string): Promise<OAuth__AuthCode|null> {
    let authCode = crypto.randomBytes(16).toString("hex");
    let redirectURIId = (await OAuth__ClientURI.findOne({
        where: {
            clientId: clientId,
            redirectURI: redirectURI
        }
    }))?.Id;

    let scopes = await OAuth__Scope.findAll({
        where: {
            scope: {
                [Op.in]: scope
            }
        },
        attributes: ["scopeId"]
    });
    if(scopes.length != scope.length) {
        return null;
    }

    let authCodeObj = await OAuth__AuthCode.create({
        authCode: authCode,
        clientId: clientId,
        userId: userId,
        redirectURIId: redirectURIId
    }, {
        include: [
            ASSOCIATION_OAuth__AuthCode_User,
            ASSOCIATION_OAuth__AuthCode_Client,
            ASSOCIATION_OAuth__AuthCode_URI
        ]
    });
    if(!authCodeObj) return null;

    await OAuth__AuthCodeScope.bulkCreate(
        scopes.map<{authCodeId: string, scopeId: string}>((scope) => {
            return { scopeId: scope.scopeId, authCodeId: authCodeObj.authCodeId};
        })
    );
    return authCodeObj;
}

export async function get(authCode: string) : Promise<OAuth__AuthCode|null> {
    return await OAuth__AuthCode.findOne({
        where: {
            authCode: authCode
        },
        include: [
            {
                association: ASSOCIATION_OAuth__AuthCode_Scope,
                as: "authCodeScopes",
                nested: true,
                attributes: ["scope"]
            },
            {
                association: ASSOCIATION_OAuth__AuthCode_URI,
                as: "authCodeRedirectURI",
                nested: true,
                attributes: ["redirectURI"]
            }
        ]
    });
}

export async function deleteAuthCode(authCode: string) : Promise<boolean> {
    let response = await OAuth__AuthCode.destroy({
        where: {
            authCode: authCode
        }
    });
    return response > 0;
}

export async function cleanupExpired() : Promise<boolean> {
    await OAuth__AuthCode.destroy({
        where: {
            authCodeExpires: {
                [Op.lt]: sequelize.literal("CURRENT_TIMESTAMP")
            }
        }
    });

    return true;
}
