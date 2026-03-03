import { useEffect, useState } from "react";
import API from "../api/axios";
import NoteCard from "../components/NoteCard";

interface Note {
  _id: string;
  title: string;
  content: string;
  owner: string;
  collaborators: string[];
}

interface User {
  _id: string;
  name: string;
  email: string;
}

export default function Dashboard() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    const loadData = async () => {
      const userRes = await API.get("/auth/me");
      setUser(userRes.data);

      const notesRes = await API.get("/notes");
      setNotes(notesRes.data);
    };

    loadData();
  }, []);

  const handleCreate = async () => {
    const { data } = await API.post("/notes", { title, content });
    setNotes((prev) => [data, ...prev]);
    setTitle("");
    setContent("");
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Notes</h1>

      <div className="border p-4 mb-6 rounded shadow-sm">
        <h2 className="font-semibold mb-2">Create Note</h2>

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
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create
        </button>
      </div>

      {notes.map((note) => (
        <NoteCard
  key={note._id}
  note={note}
  currentUserId={user?._id || ""}
  onDelete={(id) =>
    setNotes((prev) => prev.filter((note) => note._id !== id))
  }
/>
      ))}
    </div>
  );
}