import ExpressServer, {ExpressRouter} from "./expressServer";
import * as socketio from "socket.io"

const adminRouter = new ExpressRouter(true).addRouteGet("/", (req, res, next) => {
    res.sendFile(process.cwd() + "/html/admin.html");
})

const clientRouter = new ExpressRouter().addRouteGet("/", (req, res, next) => {
    res.sendFile(process.cwd() + "/html/index.html");
});

const Express = new ExpressServer().addMiddleware("/admin", adminRouter).addMiddleware("/test", clientRouter);
Express.start(3000);