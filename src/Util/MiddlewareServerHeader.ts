import express from "express";
import config from "../config/config.json";

export default function setServerHeader(server: string): express.RequestHandler {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
        res.setHeader("Server", server.trim())
        next();
    }
}
