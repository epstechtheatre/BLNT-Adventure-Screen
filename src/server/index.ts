import ExpressServer, {ExpressRouter} from "./expressServer";
import SceneTracker, {Scene} from "./sceneTracker"
import SceneRouter from "../SceneRouter.json"
import config from "../serverConfig.json"

const adminRouter = new ExpressRouter(true).addRouteGet("/", (req, res) => {
    res.sendFile(process.cwd() + "/pages/admin.html");
})

const clientRouter = new ExpressRouter().addRouteGet("/", (req, res) => {
    res.sendFile(process.cwd() + "/pages/flow.html");
});


export class Main {
    static instance: Main
    Express: ExpressServer
    SceneTracker: SceneTracker

    constructor(SceneNamespace: Scene) {
        if (Main.instance) {
            throw Error()
        }
        this.Express = new ExpressServer(this)
        this.SceneTracker = new SceneTracker(this, SceneNamespace)
    }
}

const main = new Main((SceneRouter as Scene));
main.Express.addRouter("/admin", adminRouter).addRouter("/flow", clientRouter);

main.Express.startServer(config.port);
