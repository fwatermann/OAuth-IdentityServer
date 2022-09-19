import * as db from "../Database";
import * as crypto from "crypto";

export type OAuthClient = {
    clientId: string,
    clientSecret: string,
    clientName: string,
    clientDescription: string,
    clientOwner: string,
    trusted: boolean,
    created: number,
    updated: number
}

export type OAuthClientId = {
    clientId: string,
    clientSecret: string
}

export async function create(name: string, description: string, owner: string): Promise<OAuthClientId|null> {
    let clientId = crypto.randomUUID();
    let clientSecret = crypto.randomBytes(32).toString("hex");
    let response = await db.update("INSERT INTO OAuth__Client (clientId, clientSecret, clientName, clientDescription, clientOwner) VALUES (?, ?, ?, ?, ?)", [clientId, clientSecret, name, description, owner]);
    if(response.error) {
        throw new Error(response.error_message);
    }
    return {
        clientId: clientId,
        clientSecret: clientSecret
    };
}

export async function get(clientId: string) : Promise<OAuthClient|null> {
    let response = await db.query("SELECT * FROM OAuth__Client WHERE clientId = ?", [clientId]);
    if(response.error) {
        throw new Error(response.error_message);
    }
    if(response.rows.length === 0) {
        return null;
    }
    return {
        clientId: response.rows[0].clientId,
        clientSecret: response.rows[0].clientSecret,
        clientName: response.rows[0].clientName,
        clientDescription: response.rows[0].clientDescription,
        clientOwner: response.rows[0].clientOwner,
        trusted: response.rows[0].trusted,
        created: response.rows[0].created,
        updated: response.rows[0].updated
    }
}

export async function checkSecret(clientId: string, clientSecret: string): Promise<boolean> {
    let response = await db.query("SELECT clientSecret FROM OAuth__Client WHERE clientId = ?", [clientId]);
    if(response.error) {
        throw new Error(response.error_message);
    } else {
        if(response.rows.length === 0) return false;
        return response.rows[0].clientSecret === clientSecret;
    }
}

export async function checkOwner(clientId: string, clientOwner: string): Promise<boolean> {
    let response = await db.query("SELECT clientOwner FROM OAuth__Client WHERE clientId = ?", [clientId]);
    if(response.error) {
        throw new Error(response.error_message);
    } else {
        if(response.rows.length === 0) return false;
        return response.rows[0].clientOwner === clientOwner;
    }
}

export async function checkRedirectURI(clientId: string, redirectURI: string): Promise<boolean> {
    let uri = redirectURI.split("?", 1)[0];
    let response = await db.query("SELECT * FROM OAuth__ClientURIs WHERE clientId = ? AND redirectURI = ?", [clientId, uri]);
    if(response.error) {
        throw new Error(response.error_message);
    } else {
        return response.rows.length > 0;
    }
}

export async function deleteClient(clientId: string): Promise<boolean> {
    let response = await db.update("DELETE FROM OAuth__Client WHERE clientId = ?", [clientId]);
    if(response.error) {
        throw new Error(response.error_message);
    }
    return true;
}

export async function listClients(clientOwner: string): Promise<OAuthClient[]> {
    let response = await db.query("SELECT * FROM OAuth__Client WHERE clientOwner = ?", [clientOwner]);
    if(response.error) {
        throw new Error(response.error_message);
    }
    let clients: OAuthClient[] = [];
    for(let i = 0; i < response.rows.length; i++) {
        clients.push({
            clientId: response.rows[i].clientId,
            clientSecret: response.rows[i].clientSecret,
            clientName: response.rows[i].clientName,
            clientDescription: response.rows[i].clientDescription,
            clientOwner: response.rows[i].clientOwner,
            trusted: response.rows[0].trusted,
            created: response.rows[i].created,
            updated: response.rows[i].updated
        });
    }
    return clients;
}

export async function updateClient(clientId: string, clientName?: string, clientDescription?: string): Promise<boolean> {
    let sql = "UPDATE OAuth__Client SET ";
    let params: any[] = [];
    if(clientName) {
        sql += "clientName = ?, ";
        params.push(clientName);
    }
    if(clientDescription) {
        sql += "clientDescription = ?, ";
        params.push(clientDescription);
    }
    sql = sql.slice(0, -2);
    sql += " WHERE clientId = ?";
    params.push(clientId);
    let response = await db.update(sql, params);
    if(response.error) {
        throw new Error(response.error_message);
    }
    return true;
}
