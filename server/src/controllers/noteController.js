import Note from "../models/Note.js";
import User from "../models/User.js";

/*
CREATE NOTE
*/
export const createNote = async (req, res) => {
  try {
    const note = await Note.create({
      title: req.body.title,
      content: req.body.content,
      owner: req.user._id,
    });

    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/*
GET ALL NOTES (owner + collaborator)
*/
export const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({
      $or: [
        { owner: req.user._id },
        { collaborators: req.user._id },
      ],
    });

    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/*
UPDATE NOTE
Owner OR collaborator can update
*/
export const updateNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note)
      return res.status(404).json({ message: "Note not found" });

    const isOwner = note.owner.toString() === req.user._id.toString();
    const isCollaborator = note.collaborators.includes(req.user._id);

    if (!isOwner && !isCollaborator)
      return res.status(403).json({ message: "Not allowed" });

    note.title = req.body.title || note.title;
    note.content = req.body.content || note.content;

    const updated = await note.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/*
DELETE NOTE
Only owner can delete
*/
export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    // ✅ Check if logged user is OWNER
    if (note.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only owner can delete" });
    }

    await note.deleteOne();

    res.json({ message: "Note deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/*
ADD COLLABORATOR
Only owner can add
*/
export const addCollaborator = async (req, res) => {
  try {
    const { email } = req.body;

    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    // ✅ Only owner can add collaborators
    if (note.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only owner can add collaborators" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!note.collaborators.includes(user._id)) {
      note.collaborators.push(user._id);
      await note.save();
    }

    res.json({ message: "Collaborator added" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
/*
SEARCH NOTES
*/
export const searchNotes = async (req, res) => {
  try {
    const notes = await Note.find({
      $text: { $search: req.query.q },
      $or: [
        { owner: req.user._id },
        { collaborators: req.user._id },
      ],
    });

    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};