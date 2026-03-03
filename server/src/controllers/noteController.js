import Note from "../models/Note.js";
import User from "../models/User.js";

// ── Create Note ───────────────────────────────────────────
export const createNote = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content)
      return res.status(400).json({ message: "Title and content are required" });

    const note = await Note.create({
      title: title.trim(),
      content,
      owner: req.user._id,
    });

    await note.populate("owner", "name email"); // ✅ populate immediately
    res.status(201).json(note);
  } catch (error) {
    console.error("Create note error:", error);
    res.status(500).json({ message: "Server error creating note" });
  }
};

// ── Get All Notes ─────────────────────────────────────────
export const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({
      $or: [{ owner: req.user._id }, { collaborators: req.user._id }],
    })
      .populate("owner", "name email")           // ✅ added
      .populate("collaborators", "name email")   // ✅ added
      .sort({ updatedAt: -1 });                  // ✅ newest first

    res.json(notes);
  } catch (error) {
    console.error("Get notes error:", error);
    res.status(500).json({ message: "Server error fetching notes" });
  }
};

// ── Get Note By ID ────────────────────────────────────────
// ✅ NEW — was missing entirely, needed for editor page
export const getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate("owner", "name email")
      .populate("collaborators", "name email");

    if (!note) return res.status(404).json({ message: "Note not found" });

    const isOwner = note.owner._id.toString() === req.user._id.toString();
    const isCollaborator = note.collaborators.some(
      (c) => c._id.toString() === req.user._id.toString()
    );

    if (!isOwner && !isCollaborator)
      return res.status(403).json({ message: "Access denied" });

    res.json(note);
  } catch (error) {
    console.error("Get note error:", error);
    res.status(500).json({ message: "Server error fetching note" });
  }
};

// ── Update Note ───────────────────────────────────────────
export const updateNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    const isOwner = note.owner.toString() === req.user._id.toString();
    const isCollaborator = note.collaborators.some(
      (id) => id.toString() === req.user._id.toString()
    );

    if (!isOwner && !isCollaborator)
      return res.status(403).json({ message: "Not allowed" });

    if (req.body.title !== undefined) note.title = req.body.title.trim();
    if (req.body.content !== undefined) note.content = req.body.content;

    if (note.title === "") // ✅ prevent blank title after trim
      return res.status(400).json({ message: "Title cannot be empty" });

    const updated = await note.save();
    await updated.populate("owner", "name email");
    await updated.populate("collaborators", "name email");

    res.json(updated);
  } catch (error) {
    console.error("Update note error:", error);
    res.status(500).json({ message: "Server error updating note" });
  }
};

// ── Delete Note ───────────────────────────────────────────
export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    if (note.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Only the owner can delete this note" });

    await note.deleteOne();
    res.json({ message: "Note deleted", id: req.params.id }); // ✅ returns ID for frontend state
  } catch (error) {
    console.error("Delete note error:", error);
    res.status(500).json({ message: "Server error deleting note" });
  }
};

// ── Add Collaborator ──────────────────────────────────────
export const addCollaborator = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    if (note.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Only the owner can add collaborators" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ message: "No user found with that email" });

    // ✅ prevent owner adding themselves
    if (user._id.toString() === req.user._id.toString())
      return res.status(400).json({ message: "You are already the owner" });

    const alreadyAdded = note.collaborators.some(
      (id) => id.toString() === user._id.toString()
    );
    if (alreadyAdded)
      return res.status(400).json({ message: "User is already a collaborator" });

    note.collaborators.push(user._id);
    await note.save();

    // ✅ returns collaborator info so frontend updates UI immediately
    res.json({
      message: "Collaborator added successfully",
      collaborator: { _id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Add collaborator error:", error);
    res.status(500).json({ message: "Server error adding collaborator" });
  }
};

// ── Remove Collaborator ───────────────────────────────────
// ✅ NEW — was missing entirely
export const removeCollaborator = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const note = await Note.findById(id);

    if (!note) return res.status(404).json({ message: "Note not found" });

    if (note.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Only the owner can remove collaborators" });

    const before = note.collaborators.length;
    note.collaborators = note.collaborators.filter(
      (cid) => cid.toString() !== userId
    );

    if (note.collaborators.length === before)
      return res.status(404).json({ message: "Collaborator not found on this note" });

    await note.save();
    res.json({ message: "Collaborator removed", userId });
  } catch (error) {
    console.error("Remove collaborator error:", error);
    res.status(500).json({ message: "Server error removing collaborator" });
  }
};

/// ── Search Notes ──────────────────────────────────────────
export const searchNotes = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }

    // ✅ FIX: $text and $or must be wrapped inside $and
    // MongoDB does NOT allow $text alongside $or at root level
    const notes = await Note.find({
      $and: [
        { $text: { $search: q.trim() } },
        {
          $or: [
            { owner: req.user._id },
            { collaborators: req.user._id },
          ],
        },
      ],
    })
      .populate("owner", "name email")
      .populate("collaborators", "name email")
      .select({ score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" } });

    res.json(notes);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Server error during search" });
  }
};