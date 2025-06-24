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
    let storagePath = null;

    // Upload para o Firebase Storage se houver mídia
    if (file) {
      const filename = `${uuidv4()}-${file.originalname}`;
      storagePath = `posts/${filename}`; // Caminho interno do Storage
      const fileRef = storage.bucket().file(storagePath);

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
      storagePath,
      criadoEm: new Date()
    });

    res.status(200).json({
      id: docRef.id,
      mensagem: 'Post salvo com sucesso!',
      mediaUrl,
      storagePath
    });

  } catch (error) {
    console.error('Erro ao salvar post:', error);
    res.status(500).json({ erro: 'Erro ao salvar post.' });
  }
});

// ✅ NOVA ROTA PARA PEGAR POSTS
app.get('/posts', async (req, res) => {
  try {
    const postsSnapshot = await db.collection('posts').orderBy('criadoEm', 'desc').get();
    const postsData = [];

    for (const doc of postsSnapshot.docs) {
      const post = doc.data();
      const userId = post.userId;

      // Buscar dados do usuário
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.exists ? userDoc.data() : { nome: 'Usuário desconhecido', avatarUrl: 'default-avatar.png' };

      postsData.push({
        id: doc.id,
        texto: post.texto,
        mediaUrl: post.mediaUrl,
        criadoEm: post.criadoEm,
        userId: post.userId, // 👈 ESSENCIAL para o frontend saber de quem é o post
        user: {
          nome: userData.nome || userData.displayName || 'Usuário',
          avatarUrl: userData.avatarUrl || 'default-avatar.png'
        }
      });

    }

    res.json(postsData);

  } catch (error) {
    console.error('Erro ao buscar posts:', error);
    res.status(500).json({ error: 'Erro ao buscar posts' });
  }
});

app.get('/meus-posts', async (req, res) => {
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

app.delete('/excluir-post/:id', async (req, res) => {
  const postId = req.params.id;

  try {
    const postRef = db.collection('posts').doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return res.status(404).json({ erro: 'Post não encontrado', postId });
    }

    const postData = postDoc.data();
    const storagePath = postData.storagePath;
    const mediaUrl = postData.mediaUrl;
    let mediaStatus = 'Nenhuma mídia para excluir';

    // Excluir do Firebase Storage se houver storagePath
    if (storagePath) {
      try {
        await storage.bucket().file(storagePath).delete();
        mediaStatus = `Mídia excluída com sucesso: ${storagePath}`;
        console.log(mediaStatus);
      } catch (err) {
        mediaStatus = `Erro ao excluir mídia: ${err.message}`;
        console.warn(mediaStatus);
      }
    }

    // Excluir o post do Firestore
    await postRef.delete();
    console.log(`Post ${postId} excluído do Firestore.`);

    res.json({
      mensagem: 'Post excluído com sucesso',
      postId,
      mediaUrl,
      storagePath,
      mediaStatus
    });

  } catch (error) {
    console.error('Erro ao excluir post e/ou mídia:', error);
    res.status(500).json({
      erro: 'Erro ao excluir post e/ou mídia',
      postId,
      detalhes: error.message
    });
  }
});

// CURTIR ou DESCURTIR
app.post('/curtir-post', async (req, res) => {
  const { postId, userId } = req.body;

  if (!postId || !userId) {
    return res.status(400).json({ erro: 'postId e userId são obrigatórios' });
  }

  const likeRef = db.collection('posts').doc(postId).collection('likes').doc(userId);

  try {
    const doc = await likeRef.get();

    if (doc.exists) {
      // Já curtiu? Então descurte (remove)
      await likeRef.delete();
      res.json({ status: 'descurtido' });
    } else {
      // Ainda não curtiu? Então curte
      await likeRef.set({ curtidoEm: new Date() });
      res.json({ status: 'curtido' });
    }
  } catch (error) {
    console.error("Erro ao curtir/descurtir:", error);
    res.status(500).json({ erro: 'Erro ao curtir/descurtir' });
  }
});

// OBTER QUANTAS CURTIDAS UM POST TEM
app.get('/curtidas/:postId', async (req, res) => {
  const postId = req.params.postId;

  try {
    const snapshot = await db.collection('posts').doc(postId).collection('likes').get();
    res.json({ total: snapshot.size });
  } catch (error) {
    console.error("Erro ao buscar curtidas:", error);
    res.status(500).json({ erro: 'Erro ao buscar curtidas' });
  }
});


app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
