import express from "express";
import routerUser from "./api/user";

const router = express.Router();
export default router;

router.use("/user", routerUser);
