import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createNote,
  getNotes,
  updateNote,
  deleteNote,
  addCollaborator,
  searchNotes,
} from "../controllers/noteController.js";

const router = express.Router();

router.route("/")
  .post(protect, createNote)
  .get(protect, getNotes);

router.get("/search", protect, searchNotes);

router.route("/:id")
  .put(protect, updateNote)
  .delete(protect, deleteNote);

router.put("/:id/collaborate", protect, addCollaborator);

export default router;