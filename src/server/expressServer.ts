import express, {Express, RequestHandler, Router} from "express";
import http from 'http';
import basicAuth from "express-basic-auth"
import {Server} from "socket.io";
import { Main } from ".";
import { SceneNameNotFoundError } from "./customErrors";
import fs from "fs"

export default class ExpressServer {
    main: Main
    app: Express
    httpServer: http.Server
    io?: Server
    constructor(main: Main) {
        this.main = main
        this.app = express()
        this.httpServer = new http.Server(this.app);
        
        this.io = new Server()
        this.io.attach(this.httpServer);

        this.app.set("socketio", this.io);

        //Set public folder
        this.app.use(express.static(process.cwd() + "/public"));

        this.createIOListener();    
    }

    private createIOListener() {
        this.io?.on('connection', (socket) => {
            console.log('a user connected');

            socket.on("disconnect", () => {
                console.log("a user disconnected")
            })

            socket.on("getCurrentSceneName", (callback) => {
                callback(this.main.SceneTracker.currentScene.sceneName)
            })

            socket.on("sceneSelect", (sceneName: string) => {
                console.log(`Scene Selected: ${sceneName}`)

                try {
                    this.main.SceneTracker.gotoNextScene(sceneName)
                } catch (e) {

                    if (e instanceof SceneNameNotFoundError) {
                        console.error("Scene Selected not Found!")
                    } else {
                        throw e
                    }
                }
            })

            socket.on("synchronize", () => {
                this.main.SceneTracker.synchronize()
            })
            
            socket.on("colourChoices", () => {
                console.log("Displaying colour choices")
                this.main.SceneTracker.displayColourChoices();
            })
            socket.on("customOverlay", (customOverlay) => {
                console.log(`Custom overlay ${customOverlay}`)
                this.emitNewOverlayText(customOverlay);
            })
            socket.on("recolourAll", (colour: string) => {
                this.main.SceneTracker.recolourAll((colour as "red"))
            })

            socket.on("reset", () => {
                console.warn("Resetting...")
                this.main.SceneTracker.reset();
            })
        });
    }

    emitCurrentSceneName(sceneName: string) {
        this.io?.emit("currentSceneName", sceneName)
    }

    emitSceneOptions(sceneNames: Array<string>) {
        if (sceneNames.length === 0) {
            this.io?.emit("sceneNameOptions", ["Return To Start"])
        } else {
            this.io?.emit("sceneNameOptions", sceneNames)
        }
    }

    emitColourEvent(objectID: string, newColour: string): ExpressServer {
        this.io?.emit("colourUpdate", objectID, newColour);

        return this;
    }

    emitNewOverlayText(text: string): ExpressServer {
        this.io?.emit("overlayUpdate", text);

        return this;
    }

    addRouter(parentPath: string, ExpressRouter: ExpressRouter): ExpressServer {
        this.app.use(parentPath, ExpressRouter.router)

        return this;
    }

    startServer(port: number): void {
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
    return "You failed to authenticate with the server. Better Luck Next Time!"
}