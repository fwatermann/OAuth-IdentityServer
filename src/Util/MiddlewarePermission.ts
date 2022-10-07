import express from "express";

export default function requirePermission(...permissions: string[]): express.RequestHandler {
    return (req, res, next) => {
        if(!req.user || !req.loggedIn) {
            res.error("UNAUTHORIZED", "You need to be logged in to request this resource.")
            return;
        }
        let userPermissions = req.user.permissions.map<string>((obj) => obj.permission);
        for(let p of permissions) {
            if(userPermissions.indexOf(p) < 0) {
                res.error("FORBIDDEN", "You need to have additional permissions to request this resource.")
                return;
            }
        }
        next();
    }
}
