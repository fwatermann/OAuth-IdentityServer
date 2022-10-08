import express from "express";

export default function requireLogin(): express.RequestHandler {
    return (req, res, next) => {
        if(!req.loggedIn || !req.user) {
            res.error("UNAUTHORIZED", "You need to be logged in to access this resource.");
            return;
        }
        next();
    }
}
