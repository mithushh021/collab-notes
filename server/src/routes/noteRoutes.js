import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createNote, getNotes, getNoteById,
  updateNote, deleteNote,
  addCollaborator, removeCollaborator, // ✅ added
  searchNotes,
} from "../controllers/noteController.js";

const router = express.Router();

router.route("/")
  .post(protect, createNote)
  .get(protect, getNotes);

router.get("/search", protect, searchNotes); // ✅ must be BEFORE /:id

router.route("/:id")
  .get(protect, getNoteById)     // ✅ added
  .put(protect, updateNote)
  .delete(protect, deleteNote);

router.put("/:id/collaborate", protect, addCollaborator);
router.delete("/:id/collaborate/:userId", protect, removeCollaborator); // ✅ added

export default router;