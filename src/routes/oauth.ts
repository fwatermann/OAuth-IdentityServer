import express from "express";
import routerAuthorize from "./oauth/authorize";
import routerToken from "./oauth/token";
import {METHOD_NOT_ALLOWED, NOT_FOUND} from "../errors";

const router = express.Router();
export default router;

router.use("/authorize", routerAuthorize);
router.use("/token", routerToken);

router.all("/", (req, res, next) => {
    res.status(405).json(NOT_FOUND("URL incomplete.", "The provided url is incomplete.", {
        useful_endpoints: [
            "/oauth/token",
            "/oauth/authorize",
            "..."
        ]
    }));
});
