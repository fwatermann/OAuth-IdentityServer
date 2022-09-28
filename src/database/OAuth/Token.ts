import * as db from "../Database";
import * as crypto from "crypto";
import config from "../../config/config.json";
import {
    ASSOCIATION_OAuth__Token__User,
    ASSOCIATION_OAuth__Token_Client,
    ASSOCIATION_OAuth__Token_Scope, ASSOCIATION_OAuth__Token_Token,
    OAuth__Token, OAuth__Scope, OAuth__TokenScope
} from "../Database";
import sequelize, {Op} from "sequelize";

export type OAuthTokenType = "userAccess" | "clientAccess" | "userRefresh";

export type OAuthTokenScopeInfo = {
    name: string,
    description: string,
}

export async function create(type: OAuthTokenType, scope: string[], clientId: string, userId: string, refreshToken?: string): Promise<OAuth__Token|null> {
    let token = crypto.randomBytes(16).toString("hex");

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

    let tokenObj = await OAuth__Token.create({
        token: token,
        tokenType: type,
        clientId: clientId,
        userId: userId,
        refreshTokenId: refreshToken
    }, {
        include: [
            {
                association: ASSOCIATION_OAuth__Token_Client,
                as: "tokenClient"
            },
            {
                association: ASSOCIATION_OAuth__Token__User,
                as: "tokenUser"
            },
            {
                association: ASSOCIATION_OAuth__Token_Token,
                as: "tokenRefreshToken"
            }
        ]
    });

    await OAuth__TokenScope.bulkCreate(
        scopes.map<{tokenId: string, scopeId: string}>((obj) => {
            return {tokenId: tokenObj.tokenId, scopeId: obj.scopeId};
        })
    );
    return tokenObj;
}

export async function get(token: string) : Promise<OAuth__Token|null> {
    return OAuth__Token.findOne({
        where: {
            token: token
        }
    });
}

export async function deleteToken(token: string) : Promise<boolean> {
    return (await OAuth__Token.destroy({
        where: {
            token: token
        }
    })) > 0;
}

export async function cleanupExpired() : Promise<boolean> {
    return (await OAuth__Token.destroy({
        where: {
            tokenExpires: {
                [Op.lt]: sequelize.literal("CURRENT_TIMESTAMP")
            }
        }
    })) > 0;
}

export async function getScopeInfo(scope : string): Promise<OAuth__Scope|null> {
    return OAuth__Scope.findByPk(scope);
}

export async function getRelationshipCount(refreshTokenId: string): Promise<number> {
    return (await OAuth__Token.findAndCountAll({
        where: {
            refreshTokenId: refreshTokenId
        }
    })).count;
}
