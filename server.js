// server.js
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { db, storage } from './firebase/admin.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Configurar o multer para lidar com uploads de imagem/vídeo
const upload = multer({ storage: multer.memoryStorage() });

// Rota para salvar post com texto e mídia (imagem/vídeo)
app.post('/salvar-post', upload.single('media'), async (req, res) => {
  try {
    const { texto, userId } = req.body;
    const file = req.file;
    let mediaUrl = null;

    // Upload para o Firebase Storage se houver mídia
    if (file) {
      const filename = `${uuidv4()}-${file.originalname}`;
      const fileRef = storage.bucket().file(`posts/${filename}`);
      await fileRef.save(file.buffer, {
        metadata: { contentType: file.mimetype },
        public: true
      });
      mediaUrl = `https://storage.googleapis.com/${fileRef.bucket.name}/${fileRef.name}`;
    }

    // Salvar o post no Firestore
    const docRef = await db.collection('posts').add({
      texto,
      userId,
      mediaUrl,
      criadoEm: new Date()
    });

    res.status(200).json({ id: docRef.id, mensagem: 'Post salvo com sucesso!' });
  } catch (error) {
    console.error('Erro ao salvar post:', error);
    res.status(500).json({ erro: 'Erro ao salvar post.' });
  }
});
// ✅ NOVA ROTA PARA PEGAR POSTS
app.get("/posts", async (req, res) => {
  try {
    const snapshot = await db.collection("posts").orderBy("createdAt", "desc").get();
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(posts);
  } catch (error) {
    console.error("Erro ao buscar posts:", error);
    res.status(500).json({ erro: "Erro ao buscar posts" });
  }
});
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
