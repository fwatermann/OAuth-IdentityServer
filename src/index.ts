import express, {NextFunction, Request, Response} from "express";
import routerLogin from "./routes/login";
import routerLogout from "./routes/logout";
import routerOAuth from "./routes/oauth";
import routerAccount from "./routes/account";
import path from "path";
import cookieParser from "cookie-parser";
import {INTERNAL_SERVER_ERROR, NOT_FOUND} from "./errors";
import * as OAuthDB from "./database/OAuthDB";
import config from "./config/config.json";
import morgan from "morgan";
import helmet from "helmet";
const node2fa = require("node-2fa");

const app = express();

interface ParsedQs {
    [key: string]: undefined | string | string[] | ParsedQs | ParsedQs[]
}

const logger = morgan("[:date[iso]] :method :url :status :res[content-length] - :response-time ms");

app.use(logger);
app.use(helmet({
    hidePoweredBy: true,
    contentSecurityPolicy: {
        directives: {
            "default-src": "'self' " + config.security.allowedResourceOrigins.join(" ")
        },
        useDefaults: false
    }
}));

app.use((req, res, next) => {
    res.setHeader("Server", config.ui.globalPlaceholder.serviceName.trim() + " Server")
    next();
});


app.use(express.json({
    strict: true,
    type: "application/json"
}));
app.use(express.urlencoded({
    extended: true,
    type: "application/x-www-form-urlencoded"
}));
app.use(cookieParser());
app.use(async (req, res, next) => {
    if (req.cookies[config.session.cookie.name]) {
        (req as any).session = await OAuthDB.Session.get(req.cookies[config.session.cookie.name]);
    }
    next();
});

app.use("/assets/", express.static(path.join(__dirname, "public", "assets"), {
    etag: false,
    index: "index.html",
    redirect: true
}));

console.log(path.join(__dirname, "public", "assets"));

app.use("/login", routerLogin);
app.use("/logout", routerLogout);
app.use("/oauth", routerOAuth);
app.use("/account", routerAccount);

function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    console.error(err);
    res.status(500).json(INTERNAL_SERVER_ERROR("Exception while handling request.", "The server has run into an exception. Please try again later.", err));
}

app.use(errorHandler);
app.use((req, res, next) => res.status(404).json(NOT_FOUND("Page/Endpoint not found.", "The requested url does not exist.")))

app.listen(config.server.port, () => {
    OAuthDB.setup();
    console.log("Listening...");
});
