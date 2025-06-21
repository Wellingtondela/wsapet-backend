import express from "express";
import cors from "cors";
import { db } from "./firebase/admin.js"; // importa o Firestore já inicializado

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rota raiz só para teste
app.get("/", (req, res) => {
  res.send("API WSAPet backend funcionando!");
});

// Rota para listar posts do Firestore
app.get("/posts", async (req, res) => {
  try {
    const snapshot = await db.collection("posts").orderBy("timestamp", "desc").get();
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(posts);
  } catch (error) {
    console.error("Erro ao buscar posts:", error);
    res.status(500).json({ error: "Erro ao buscar posts" });
  }
});

// Rota para criar um post (exemplo simples)
app.post("/posts", async (req, res) => {
  try {
    const { userId, texto, mediaUrl, mediaType } = req.body;
    if (!userId) return res.status(400).json({ error: "userId é obrigatório" });

    const docRef = await db.collection("posts").add({
      userId,
      texto: texto || "",
      mediaUrl: mediaUrl || "",
      mediaType: mediaType || "",
      timestamp: new Date()
    });

    res.status(201).json({ id: docRef.id, message: "Post criado com sucesso" });
  } catch (error) {
    console.error("Erro ao criar post:", error);
    res.status(500).json({ error: "Erro ao criar post" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
