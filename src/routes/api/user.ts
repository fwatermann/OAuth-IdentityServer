import express from "express";
import routerPassword from "./user/password";
import router2FA from "./user/2fa";
import requireScope from "../../Util/MiddlewareRequireScope";


const router = express.Router();
export default router;

router.use("/password", requireScope(true, "user:edit:password"), routerPassword);
router.use("/2fa", requireScope(true, "user:edit:twofactor"), router2FA);

