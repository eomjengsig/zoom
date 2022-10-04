import http from "http";
import WebSocket from "ws";
import express from "express";
import { type } from "os";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));

app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log(`✅Listening on http://localhost:4000/`);
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const sockets = [];

wss.on("connection", (socket) => {
  sockets.push(socket);
  socket["nickname"] = "익명";
  console.log("✅Connected to Browser");
  socket.on("close", () => console.log("❌Disconnected from Browser"));
  socket.on("message", (message) => {
    const parsed = JSON.parse(message);
    switch (parsed.type) {
      case "new_message":
        sockets.forEach((aSocket) =>
          aSocket.send(`${socket.nickname}: ${parsed.payload.toString()}`)
        );
        break;
      case "nickname":
        socket["nickname"] = parsed.payload;
        break;
    }
  });
});

server.listen(4000, handleListen);
