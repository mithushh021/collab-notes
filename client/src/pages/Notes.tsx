import { useEffect, useState } from "react";
import { fetchNotes, createNote } from "../api";

interface Note {
  _id: string;
  title: string;
  content: string;
}

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const loadNotes = async () => {
    const data = await fetchNotes();
    setNotes(data);
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleCreate = async () => {
    await createNote(title, content);
    setTitle("");
    setContent("");
    loadNotes();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Notes</h1>

      <div className="mb-6">
        <input
          className="border p-2 w-full mb-2"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="border p-2 w-full mb-2"
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button
          onClick={handleCreate}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Create Note
        </button>
      </div>

      <div>
        {notes.map((note) => (
          <div key={note._id} className="border p-3 mb-2 rounded">
            <h2 className="font-bold">{note.title}</h2>
            <p>{note.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}