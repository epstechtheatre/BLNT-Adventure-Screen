import ExpressServer, {ExpressRouter} from "./expressServer";

const adminRouter = new ExpressRouter(true).addRouteGet("/", (req, res) => {
    res.sendFile(process.cwd() + "/html/admin.html");
})

const clientRouter = new ExpressRouter().addRouteGet("/", (req, res) => {
    res.sendFile(process.cwd() + "/html/index.html");
});

const Express = new ExpressServer().addRouter("/admin", adminRouter).addRouter("/test", clientRouter);
Express.startServer(3000);