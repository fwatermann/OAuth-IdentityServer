import express from "express";
import {FORBIDDEN, UNAUTHORIZED} from "../errors";

export default function requirePermission(...permissions: string[]): express.RequestHandler {
    return (req, res, next) => {
        if(!req.user) {
            res.status(401).json(UNAUTHORIZED("Not authorized", "You need to be logged in to request this resource."));
            return;
        }
        let userPermissions = req.user.permissions.map<string>((obj) => obj.permission);
        for(let p of permissions) {
            if(userPermissions.indexOf(p) < 0) {
                res.status(403).json(FORBIDDEN("Not enough permissions", "You need to have additional permissions to request this resource."));
                return;
            }
        }
        next();
    }
}
