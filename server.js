import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import Stripe from "stripe";
import "dotenv/config";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] },
});
const port = 9999;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ── CORS para rutas HTTP ───────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use(express.json());

// ── Stripe Checkout ────────────────────────────────────────────────────────
app.post("/create-checkout-session", async (req, res) => {
  const { titulo, precio, imagen, obraId, ofertaId, artEmail } = req.body;
  if (!titulo || !precio) {
    return res.status(400).json({ error: "Faltan datos de la obra" });
  }
  const precioEnCentimos = Math.round(parseFloat(precio) * 100);
  if (isNaN(precioEnCentimos) || precioEnCentimos <= 0) {
    return res.status(400).json({ error: "Precio inválido" });
  }
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: titulo,
              ...(imagen ? { images: [imagen] } : {}),
            },
            unit_amount: precioEnCentimos,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `http://localhost:5173/pago-exito?obra=${obraId}${ofertaId ? `&oferta=${ofertaId}` : ''}${artEmail ? `&art=${encodeURIComponent(artEmail)}` : ''}&titulo=${encodeURIComponent(titulo)}`,
      cancel_url: `http://localhost:5173/obra/${obraId}`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

var usuarios = {};

io.on("connection", (socket) => {
  console.log("Usuario conectado:", socket.id);

  socket.on("registrar", (email) => {
    usuarios[email] = socket.id;
    console.log("Registrado:", email);
    // Notificar a todos que este usuario está en línea
    io.emit("usuarioEstado", { email, online: true });
  });

  socket.on("obtenerOnline", () => {
    socket.emit("listaOnline", Object.keys(usuarios));
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
        // Notificar a todos que este usuario se ha desconectado
        io.emit("usuarioEstado", { email, online: false });
        break;
      }
    }
  });
});

server.listen(port, () => {
  console.log("Servidor corriendo en puerto " + port);
});
