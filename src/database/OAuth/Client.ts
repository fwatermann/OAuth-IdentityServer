import * as db from "../Database";
import * as crypto from "crypto";
import {
    ASSOCIATION_OAuth__Client_URI,
    ASSOCIATION_OAuth__Client_User,
    OAuth__Client,
    OAuth__ClientURI
} from "../Database";
import {Op} from "sequelize";

export async function create(name: string, description: string, owner: string|null): Promise<OAuth__Client|null> {
    let clientId = crypto.randomUUID();
    let clientSecret = crypto.randomBytes(32).toString("hex");
    return await OAuth__Client.create({
        clientSecret: clientSecret,
        clientName: name,
        clientDescription: description,
        clientOwner: owner
    }, {
        include: [
            {
                association: ASSOCIATION_OAuth__Client_User,
                as: "clientOwner"
            }
        ]
    });
}

export async function get(clientId: string) : Promise<OAuth__Client|null> {
    return await OAuth__Client.findByPk(clientId, {
        include: [
            {
                association: ASSOCIATION_OAuth__Client_URI,
                nested: true,
                attributes: ["redirectURI"],
                as: "redirectURIs"
            }
        ]
    });
}

export async function checkSecret(clientId: string, clientSecret: string): Promise<boolean> {
    return (await OAuth__Client.findOne({
        where: {
            clientId: clientId,
            clientSecret: clientSecret
        }
    })) != null;
}

export async function checkOwner(clientId: string, clientOwner: string): Promise<boolean> {
    return (await OAuth__Client.findOne({
        where: {
            clientId: clientId,
            clientOwner: clientOwner
        }
    })) != null;
}

export async function checkRedirectURI(clientId: string, redirectURI: string): Promise<boolean> {
    let response = await OAuth__Client.findOne({
        where: {
            clientId: clientId
        },
        include: {
            association: ASSOCIATION_OAuth__Client_URI,
            nested: true,
            as: "redirectURI",
            attributes: ["redirectURI"]
        }
    });
    let uris = response.redirectURIs.map<string>((obj) => obj.redirectURI);
    return uris.indexOf(redirectURI) >= 0;
}

export async function deleteClient(clientId: string): Promise<boolean> {
    return (await OAuth__Client.destroy({
        where: {
            clientId: clientId
        }
    })) > 0;
}

export async function listClients(clientOwner: string): Promise<OAuth__Client[]> {
    return OAuth__Client.findAll({
        where: {
            clientOwner: clientOwner
        }
    });
}

export async function updateClient(clientId: string, clientName?: string, clientDescription?: string): Promise<boolean> {
    let client = await OAuth__Client.findByPk(clientId);
    if(clientName) client.clientName = clientName;
    if(clientDescription) client.clientDescription = clientDescription;
    if(clientName || clientDescription) await client.save();
    return true;
}
