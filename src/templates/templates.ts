import fs from 'fs';
import path from 'path';
import express from "express";
import {OAuthTokenScopeInfo} from "../database/OAuth/Token";
import config from "../config/config.json";
import crypto from "crypto";

let cache = new Map();
export type Templates = "login.html"|"authorize.html";

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
            scopesDescriptions: (OAuthTokenScopeInfo|undefined)[],
            jokeScopes: string[],

            csrf: string,
            client_id: string,
            redirect_uri: string,
            response_type: string,
            scope: string,
            state: string
        } :
    never;

export default function template<T extends Templates>(file: T, ins: Placeholders<T>, req : express.Request, res: express.Response, next: express.NextFunction): void {
    let ret : string = cache.has(file) ? cache.get(file) : cache.set(file, fs.readFileSync(path.join(__dirname, file), "utf8")).get(file);

    let inserts = {...ins, ...config.ui.globalPlaceholder}

    /*
         Find single placeholders
         */

    let regexSingle = /{{\s*([a-zA-Z0-9_]+)\s*}}/gm;
    let a = ret.matchAll(regexSingle);
    for(let match of a) {
        let replace = match.at(0);
        let key = match.at(1);
        if(!key || !replace || key == "this") continue;
        if(inserts.hasOwnProperty(key)) {
            ret = ret.replace(replace, (inserts as any)[key]);
        } else {
            ret = ret.replace(replace, "");
        }
    }

    /*
        Find array placeholders
     */
    let regexLoop = /{{#(?<key>[a-zA-Z0-9_]+)}}((.*?){{this(\.[a-zA-Z0-9_]+)?}}(.*?)){{\/\k<key>}}/gs;
    let regexLoopThis = /{{this(\.[a-zA-Z0-9_]+)?}}/g;
    let b = ret.matchAll(regexLoop);
    for(let match of b) {
        let replace = match.at(0);
        let key = match.at(1);
        let loop = match.at(2) as string;
        if(!key || !replace || !loop || key == "this") continue;

        if(inserts.hasOwnProperty(key) && Array.isArray((inserts as any)[key])) {
            let array : [] = (inserts as any)[key];
            let inner = "";
            for(let i = 0; i < array.length; i ++) {
                let insert : any = array[i];

                let round = loop;
                let thiz = loop.matchAll(regexLoopThis);
                for(let thisMatch of thiz) {
                    let thisReplace = thisMatch.at(0) as string;
                    let key = thisMatch.at(1) as string;
                    if(key) {
                        key = key.substring(1);
                        if(insert.hasOwnProperty(key)) {
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
            ret = ret.replace(replace, inner);
        } else {
            ret = ret.replace(replace, "NULL");
        }

    }

    let dniRegex = /\(\(DNI:(.*?):DNI\)\)/gms;
    while(dniRegex.exec(ret)) {
        ret = ret.replace(dniRegex, "");
    }

    //Apply nonce in style-/script-tag for CSP

    let cspRegex = /<(script|style)(.*?)>/gmsid;
    let cspMatch;
    while((cspMatch = cspRegex.exec(ret))) {
        let start = cspRegex.lastIndex - (cspMatch.at(0)??"").length;

        let insert = cspMatch.at(0) as string;
        let key = cspMatch.at(1) as string;
        let parameter = cspMatch.at(2);

        if(parameter && parameter.indexOf("src=") >= 0) {
            continue;
        }

        let before = ret.substring(0, start);
        let after = ret.substring(start+(cspMatch.at(0)??"").length);
        let nonce = crypto.randomBytes(16).toString("hex");

        insert = insert.replace(key, `${key} nonce="${nonce}"`);
        let cspHeader = res.getHeader("Content-Security-Policy")??"";
        cspHeader += ` 'nonce-${nonce}'`;
        res.setHeader("Content-Security-Policy", cspHeader);

        ret = before + insert + after;
    }

    res.send(ret);

}
