import express from "express";

const router = express.Router();
export default router;

router.post("/", (req, res, next) => {

    

});

//All other methods not allowed
router.all("/", (req, res, next) => {
    res.error("METHOD_NOT_ALLOWED", "This method is not allowed for this resource.", {allowedMethods: ["POST"] });
});
