import { useEffect, useState } from "react";
import API from "../api/axios";

interface Note {
  _id: string;
  title: string;
  content: string;
}

const Dashboard = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const loadNotes = async () => {
    const { data } = await API.get("/notes");
    setNotes(data);
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleCreate = async () => {
    await API.post("/notes", { title, content });
    setTitle("");
    setContent("");
    loadNotes();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">My Notes</h1>

      {/* CREATE NOTE SECTION */}
      <div className="border p-4 mb-6 rounded">
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
          Create Note
        </button>
      </div>

      {/* NOTES LIST */}
      {notes.map((note) => (
        <div key={note._id} className="border p-4 mb-3 rounded">
          <h3 className="font-bold">{note.title}</h3>
          <p>{note.content}</p>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;