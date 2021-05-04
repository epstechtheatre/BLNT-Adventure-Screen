import express, {Express, RequestHandler, Router} from "express";
import http from 'http';
import basicAuth from "express-basic-auth"
import {Server} from "socket.io";
import { Main } from ".";
import { SceneNameNotFoundError } from "./customErrors";

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
                callback(this.main.SceneTracker.overlayText.current, this.main.SceneTracker.currentScene.sceneName)
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
                this.main.SceneTracker.overlayText.current = customOverlay
                this.emitNewOverlayText(customOverlay);
            })
            socket.on("recolour", (colour: string, recolourAll: boolean = false) => {
                if (recolourAll) {
                    let rgb = ""

                    switch (colour) {
                        case "crystal":
                            rgb = "#bae6e7"
                            break;

                        case "red":
                            rgb = "#770000";
                            break;

                        default:
                            rgb = colour;
                    }

                    this.emitColourWipe(rgb)
                } else {
                    this.main.SceneTracker.recolour((colour as "red" | "crystal"))
                }
            })

            socket.on("reset", () => {
                console.warn("Resetting...")
                this.main.SceneTracker.reset();
            })
        });
    }

    emitCurrentSceneName(sectionName: string, sceneName: string) {
        this.io?.emit("currentSceneName", sectionName, sceneName)
    }

    emitSceneOptions(sceneNames: Array<string>): ExpressServer {
        if (sceneNames.length === 0) {
            this.io?.emit("sceneNameOptions", ["Better Luck Next Time! (Return to Start)"])
        } else {
            this.io?.emit("sceneNameOptions", sceneNames)
        }
        return this;
    }

    emitColourEvent(objectID: string, newColour: string): ExpressServer {
        this.io?.emit("colourUpdate", objectID, newColour);

        return this;
    }

    emitColourWipe(newColour: string): ExpressServer {
        this.io?.emit("colourWipe", newColour);

        return this;
    }

    emitNewOverlayText(text: string): ExpressServer {
        this.io?.emit("overlayUpdate", text);

        return this;
    }

    emitDeathInteger(int: number): ExpressServer {
        this.io?.emit("deathCount", int);

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