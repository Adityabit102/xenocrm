import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { getSocketServer } from "./lib/socket/server";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error(`Error occurred handling path ${req.url}:`, err);
      res.statusCode = 500;
      res.end("Internal server error");
    }
  });

  
  getSocketServer(server);

  server.listen(port, () => {
    console.log(`> Cove Web Client ready on http://${hostname}:${port}`);
  });
});
