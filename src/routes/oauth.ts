import express from "express";
import routerAuthorize from "./oauth/authorize";
import routerToken from "./oauth/token";

const router = express.Router();
export default router;

router.use("/authorize", routerAuthorize);
router.use("/token", routerToken);

router.all("/", (req, res, next) => {
    res.error("NOT_FOUND", "The provided url is incomplete.", {
        useful_endpoints: [
            "/oauth/token",
            "/oauth/authorize",
            "..."
        ]
    });
});
