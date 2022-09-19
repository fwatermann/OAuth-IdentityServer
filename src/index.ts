import express, {NextFunction, Request, Response} from "express";
import routerLogin from "./routes/login";
import routerLogout from "./routes/logout";
import routerOAuth from "./routes/oauth";
import path from "path";
import cookieParser from "cookie-parser";
import {INTERNAL_SERVER_ERROR} from "./errors";
import * as OAuthDB from "./database/OAuthDB";
import config from "./config/config.json";
import morgan from "morgan";
import helmet from "helmet";

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

console.log(path.join(__dirname, "assets"));

app.use("/assets/", express.static(path.join(__dirname, "assets"), {
    etag: false,
    index: "index.html",
    redirect: true
}));

app.use("/login", routerLogin);
app.use("/logout", routerLogout);
app.use("/oauth", routerOAuth);

function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    console.error(err);
    res.status(500).json(INTERNAL_SERVER_ERROR("Exception while handling request.", "The server has run into an exception. Please try again later.", err));
}

app.use(errorHandler);

app.listen(8080, () => {
    OAuthDB.setup();
    console.log("Listening...");
});
