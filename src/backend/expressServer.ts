import express, {Express, RequestHandler, Router} from "express";
import http from 'http';
import basicAuth from "express-basic-auth"
import {Server} from "socket.io";
export default class ExpressServer {
    app: Express
    httpServer: http.Server
    io?: Server
    constructor() {
        this.app = express()
        this.httpServer = new http.Server(this.app);
        
        this.io = new Server()
        this.io.attach(this.httpServer);

        this.app.set("socketio", this.io);

        this.createIOListener();

        this.app.get("/", function(req, res) {
            res.send("test")
        })
    }

    private createIOListener() {
        this.io?.on('connection', (socket) => {
            socket.broadcast.emit("hi")

            console.log('a user connected');

            socket.on("disconnect", () => {
                console.log("a user disconnected")
            })

            socket.on("chat message", (msg) => {
                console.log("Message: " + msg);
                this.io?.emit("chat message", msg);
            })
        });
    }

    addMiddleware(parentPath: string, ERouter: ExpressRouter): ExpressServer {
        this.app.use(parentPath, ERouter.router)

        return this;
    }

    start(port: number): void {
        this.httpServer.listen(port, () => {
            console.log("App Listening on Port: " + port)
        })
    }
}

export class ExpressRouter {
    router: Router
    constructor(basicAuth = false) {
        this.router = express.Router();

        if (basicAuth) {
            this.useBasicAuth()
        }
    }

    addRouteGet(path: string, handler: RequestHandler): ExpressRouter {
        this.router.get(path, handler)

        return this;
    }

    private useBasicAuth(): ExpressRouter {
        this.router.use(basicAuth({
            users: { "admin": "core" },
            challenge: true,
            unauthorizedResponse: getUnauthorizedResponse
        }));

        return this;
    }
}

function getUnauthorizedResponse() {
    return `You failed successfully authenticate with the server`
}