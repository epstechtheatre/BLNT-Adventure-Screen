import ExpressServer, {ExpressRouter} from "./expressServer";

const adminRouter = new ExpressRouter(true).addRouteGet("/", (req, res) => {
    res.sendFile(process.cwd() + "/pages/admin.html");
})

const clientRouter = new ExpressRouter().addRouteGet("/", (req, res) => {
    res.sendFile(process.cwd() + "/pages/index.html");
});

const Express = new ExpressServer().addRouter("/admin", adminRouter).addRouter("/test", clientRouter);
Express.startServer(3000);