import { getFirestore, Timestamp } from "firebase-admin/firestore";

export const criarAgendamento = async (req, res) => {
  const db = getFirestore();
  try {
    const { uid, clinicaId, dataHora } = req.body;
    const novo = {
      uid,
      clinicaId,
      dataHora: Timestamp.fromDate(new Date(dataHora)),
      criadoEm: Timestamp.now()
    };
    const docRef = await db.collection("agendamentos").add(novo);
    res.status(201).json({ id: docRef.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar agendamento" });
  }
};