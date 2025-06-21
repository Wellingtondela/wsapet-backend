import express from "express";
import { getPerfil } from "../controllers/perfilController.js";
const router = express.Router();

router.get("/:uid", getPerfil);

export default router;