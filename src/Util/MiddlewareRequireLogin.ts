import express from "express";
import {FORBIDDEN, UNAUTHORIZED} from "../errors";

export default function requireLogin(): express.RequestHandler {
    return (req, res, next) => {
        if(!req.user) {
            res.status(401).json(UNAUTHORIZED("Not authorized", "You need to be logged in to request this resource."));
            return;
        }
        next();
    }
}
