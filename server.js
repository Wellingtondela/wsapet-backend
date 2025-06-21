import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import perfilRoutes from "./routes/perfilRoutes.js";
import agendamentoRoutes from "./routes/agendamentoRoutes.js";
import "./firebase/admin.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/perfil", perfilRoutes);
app.use("/api/agendamentos", agendamentoRoutes);

app.get("/", (req, res) => {
  res.send("Servidor WSA Pet rodando!");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor ouvindo na porta ${PORT}`);
});