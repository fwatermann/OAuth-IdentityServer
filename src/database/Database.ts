import MySQL from "mysql";
import fs from "fs";
import configFile from "../config/config.json";

type DBConfig = {
    host: string,
    port: number,
    username: string,
    password: string,
    database: string,
    supportBigNumbers?: boolean,
    connectionLimit?: number
}

type QueryResponse = {
    error: boolean,
    error_message: string,
    rows: any[]
}

type UpdateResponse = {
    error: boolean,
    error_message: string,
    fieldCount: number,
    affectedRows: number,
    insertId: number,
    serverStatus: number,
    warningCount: number,
    message: string,
    protocol41: boolean,
    changedRows: number
}

const config : DBConfig = configFile.database;
const createScript : string[] = fs.readFileSync("./create.sql", "utf8").split(";");

let isSetup = false;

const pool : MySQL.Pool = MySQL.createPool({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.database,
    connectionLimit: config.connectionLimit,
    supportBigNumbers: config.supportBigNumbers
});

export async function setup() : Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        if(isSetup) resolve();
        for(const script of createScript) {
            await pool.query(script);
        }
        isSetup = true;
        resolve();
    });
}

export async function query(sql : string, params : any[]) : Promise<QueryResponse> {
    return new Promise<any>(async (resolve, reject) => {
        pool.query(sql, params, (err, result) => {
            if(err) {
                resolve({error: true, error_message: err.message, rows: []});
            } else {
                resolve({error: false, error_message: "", rows: result});
            }
        });
    });
}

export async function update(sql : string, params: any[]) : Promise<UpdateResponse> {
    return new Promise<any>(async (resolve, reject) => {
        pool.query(sql, params, (err, result) => {
            if(err) {
                resolve({error: true, error_message: err.message, fieldCount: 0, affectedRows: 0, insertId: 0, serverStatus: 0, warningCount: 0, message: "", protocol41: false, changedRows: 0});
            } else {
                resolve({error: false, error_message: "", fieldCount: result.fieldCount, affectedRows: result.affectedRows, insertId: result.insertId, serverStatus: result.serverStatus, warningCount: result.warningCount, message: result.message, protocol41: result.protocol41, changedRows: result.changedRows});
            }
        });
    });
}
