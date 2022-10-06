import http from "http";
import express from "express";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));

app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log(`✅Listening on http://localhost:4000/`);
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
});
instrument(io, {
  auth: false,
});

const publicRooms = () => {
  const sids = io.sockets.adapter.sids;
  const rooms = io.sockets.adapter.rooms;
  const publicRoomList = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRoomList.push(key);
    }
  });
  return publicRoomList;
};
const countRoom = (roomName) => {
  return io.sockets.adapter.rooms.get(roomName)?.size;
};

io.on("connection", (socket) => {
  socket["nickname"] = "익명";
  socket.onAny((event) => {
    console.log(event);
  });
  socket.on("enter_room", (roomName, nick, done) => {
    socket.join(roomName);
    socket.nickname = nick;
    socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
    done(countRoom(roomName));
    io.sockets.emit("room_change", publicRooms());
  });
  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) =>
      socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1)
    );
  });
  socket.on("disconnect", () => {
    io.sockets.emit("room_change", publicRooms());
  });
  socket.on("new_message", (msg, room, done) => {
    socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
    done();
  });
  socket.on("nickname", (nickname) => (socket["nickname"] = nickname));
});
/*
const wss = new WebSocket.Server({ server });
const sockets = [];

wss.on("connection", (socket) => {
  sockets.push(socket);
  socket["nickname"] = "익명";
  console.log("✅Connected to Browser");
  socket.on("close", () => console.log("❌Disconnected from Browser"));
  socket.on("message", (message) => {
    const parsed = JSON.parse(message);
    if (parsed.type === "new_message") {
      sockets.forEach((aSocket) =>
        aSocket.send(`${socket.nickname}: ${parsed.payload.toString()}`)
      );
    } else if (parsed.type === "nickname") {
      socket["nickname"] = parsed.payload;
    }
  });
});
*/
server.listen(4000, handleListen);
