import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] },
});
const port = 9999;

var usuarios = {};

io.on("connection", (socket) => {
  console.log("Usuario conectado:", socket.id);

  socket.on("registrar", (email) => {
    usuarios[email] = socket.id;
    console.log("Registrado:", email);
  });

  socket.on("mensajePrivado", (datos) => {
    const destinatario = usuarios[datos.para];
    if (destinatario) {
      io.to(destinatario).emit("mensajePrivado", datos);
    }
    socket.emit("mensajePrivado", datos);
  });

  socket.on("disconnect", () => {
    for (const email in usuarios) {
      if (usuarios[email] === socket.id) {
        delete usuarios[email];
        break;
      }
    }
  });
});

server.listen(port, () => {
  console.log("Servidor corriendo en puerto " + port);
});
