import express from "express";
import errorFunction from "../errors";

export default function functionInjector(req: express.Request, res: express.Response, next: express.NextFunction) {
    res.error = errorFunction(req, res, next);
    res.noContent = () => {
        res.status(204).send();
    }
    next();
}
