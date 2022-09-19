import express from "express";
import routerAuthorize from "./oauth/authorize";
import routerToken from "./oauth/token";

const router = express.Router();
export default router;

router.use("/authorize", routerAuthorize);
router.use("/token", routerToken);
