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
app.get('/posts', async (req, res) => {
  const userId = req.query.uid;

  if (!userId) {
    return res.status(400).json({ error: 'ID do usuário não informado.' });
  }

  try {
    const postsSnapshot = await db.collection('posts')
      .where('userId', '==', userId)
      .orderBy('criadoEm', 'desc')
      .get();

    const postsData = [];

    for (const doc of postsSnapshot.docs) {
      const post = doc.data();

      // Buscar dados do usuário
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.exists ? userDoc.data() : { nome: 'Usuário desconhecido', avatarUrl: 'default-avatar.png' };

      postsData.push({
        id: doc.id,
        texto: post.texto,
        mediaUrl: post.mediaUrl,
        criadoEm: post.criadoEm,
        user: {
          nome: userData.nome || userData.displayName || 'Usuário',
          avatarUrl: userData.avatarUrl || 'default-avatar.png'
        }
      });
    }

    res.json(postsData);

  } catch (error) {
    console.error('Erro ao buscar posts do usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar posts do usuário' });
  }
});



app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
