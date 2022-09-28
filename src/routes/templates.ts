import fs from 'fs';
import path from 'path';
import express from "express";
import {OAuthTokenScopeInfo} from "../database/OAuth/Token";
import config from "../config/config.json";
import crypto from "crypto";
import {OAuth__Scope} from "../database/Database";
import {UserSettingsPages} from "./settings/User";

export type FilledPage = {
    name: string,
    nonce: string[],
    source: string;
}

let cache = new Map();
export type SettingsPages = "settings.html"|UserSettingsPages;
export type Templates = "login.html"|"authorize.html"|SettingsPages;

export type Placeholders<T extends Templates> =
    T extends "login.html"
        ? {
            username: string;
            logo_url: string;
        } :
    T extends "authorize.html"
        ? {
            clientName: string;
            clientIconURL: string,
            clientActiveSince: string
            userDisplayName: string,
            userIconURL: string,
            scopesDescriptions: (OAuth__Scope|undefined)[],
            jokeScopes: string[],

            csrf: string,
            client_id: string,
            redirect_uri: string,
            response_type: string,
            scope: string,
            state: string
        } :
    T extends "settings.html"
        ? {
            profileAvatar: string,
            profileDisplayname: string,
            permissions: string[]
        } :
    T extends "settings/user/profile.html"
        ? {

        } :
    never;

export function templateSource<T extends Templates>(file: T, ins: Placeholders<T>): FilledPage {
    let source : string = cache.has(file) ? cache.get(file) : cache.set(file, fs.readFileSync(path.join(__dirname, "../public", file), "utf8")).get(file);
    let inserts = {...ins, ...config.ui.globalPlaceholder}
    let ret : FilledPage = {
        name: file,
        source: "",
        nonce: []
    }

    let dniRegex = /\(\(DNI:(.*?):DNI\)\)/gms;
    while(dniRegex.exec(source)) {
        source = source.replace(dniRegex, "");
    }

    /*
     Find single placeholders
     */

    let regexSingle = /{{\s*([a-zA-Z0-9_]+)\s*}}/gm;
    let a = source.matchAll(regexSingle);
    for(let match of a) {
        let replace = match.at(0);
        let key = match.at(1);
        if(!key || !replace || key == "this") continue;
        if(inserts.hasOwnProperty(key)) {
            source = source.replace(replace, (inserts as any)[key]);
        } else {
            source = source.replace(replace, "");
        }
    }

    /*
        Find array placeholders
     */
    let regexLoop = /{{#(?<key>[a-zA-Z0-9_]+)}}((.*?){{this(\.[a-zA-Z0-9_]+)?}}(.*?)){{\/\k<key>}}/gs;
    let regexLoopThis = /{{this(\.[a-zA-Z0-9_]+)?}}/g;
    let b = source.matchAll(regexLoop);
    for(let match of b) {
        let replace = match.at(0);
        let key = match.at(1);
        let loop = match.at(2) as string;
        if (!key || !replace || !loop || key == "this") continue;

        if (inserts.hasOwnProperty(key) && Array.isArray((inserts as any)[key])) {
            let array: [] = (inserts as any)[key];
            let inner = "";
            for (let i = 0; i < array.length; i++) {
                let insert: any = array[i];
                if(!insert) continue;

                let round = loop;
                let thiz = loop.matchAll(regexLoopThis);
                for (let thisMatch of thiz) {
                    let thisReplace = thisMatch.at(0) as string;
                    let key = thisMatch.at(1) as string;
                    if (key) {
                        key = key.substring(1);
                        if (insert.hasOwnProperty(key)) {
                            round = round.replace(thisReplace, insert[key]);
                        } else {
                            round = round.replace(thisReplace, "this." + key);
                        }
                    } else {
                        round = round.replace(thisReplace, insert);
                    }
                }
                inner += round;
            }
            source = source.replace(replace, inner);
        } else {
            source = source.replace(replace, "NULL");
        }

    }

    /*
        Find Conditions
     */

    let conRegex = /{{\?(.*?)}}(.*?){{\/\?}}/gmsd;
    let conMatch;
    while((conMatch = conRegex.exec(source))) {
        let start = conRegex.lastIndex - (conMatch.at(0)??"").length;
        let expression = conMatch.at(1) as string;
        let content = conMatch.at(2) as string;

        let value
        try {
            value = function(str: string) {
                return eval(str);
            }.call(inserts, expression);
        } catch(e) {
            value = false;
        }

        let before = source.substring(0, start);
        let after = source.substring(conRegex.lastIndex);
        if(value) {
            source = before + content + after;
            conRegex.lastIndex = start + content.length;
        } else {
            source = before + after;
            conRegex.lastIndex = start;
        }
    }


    //Apply nonce in style-/script-tag for CSP

    let cspRegex = /<(script|style)(.*?)>/gmsid;
    let cspMatch;
    while((cspMatch = cspRegex.exec(source))) {
        let start = cspRegex.lastIndex - (cspMatch.at(0)??"").length;

        let insert = cspMatch.at(0) as string;
        let key = cspMatch.at(1) as string;
        let parameter = cspMatch.at(2);

        if(parameter && parameter.indexOf("src=") >= 0) {
            continue;
        }

        let before = source.substring(0, start);
        let after = source.substring(start+(cspMatch.at(0)??"").length);
        let nonce = crypto.randomBytes(16).toString("hex");

        insert = insert.replace(key, `${key} nonce="${nonce}"`);
        ret.nonce.push(`nonce-${nonce}`);

        source = before + insert + after;
    }

    ret.source = source;
    return ret;
}

export default function template<T extends Templates>(file: T, ins: Placeholders<T>, req : express.Request, res: express.Response, next: express.NextFunction): void {
    try {
        let page = templateSource(file, ins);
        let cspHeader = res.getHeader("Content-Security-Policy") as string;
        for(let nonce of page.nonce) {
            cspHeader += ` '${nonce}'`;
        }
        res.setHeader("Content-Security-Policy", cspHeader);
        res.send(page.source);
    } catch(e) {
        next(e);
    }
}
