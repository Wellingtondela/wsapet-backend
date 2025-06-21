import { getFirestore } from "firebase-admin/firestore";

export const getPerfil = async (req, res) => {
  const db = getFirestore();
  try {
    const uid = req.params.uid;
    const doc = await db.collection("users").doc(uid).get();
    if (!doc.exists) return res.status(404).json({ error: "Usuário não encontrado" });
    res.json(doc.data());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar perfil" });
  }
};