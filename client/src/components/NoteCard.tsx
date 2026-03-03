import API from "../api/axios";

interface Note {
  _id: string;
  title: string;
  content: string;
  owner: string;
  collaborators: string[];
}

interface Props {
  note: Note;
  currentUserId: string;
  onDelete: (id: string) => void;
}

export default function NoteCard({ note, currentUserId, onDelete }: Props) {
  const isOwner = note.owner === currentUserId;

  const handleDelete = async () => {
    try {
    await API.delete(`/notes/${note._id}`);
    onDelete(note._id);
  } catch (error) {
    console.log(error);
  }
  };

  return (
    <div className="border p-4 mb-3 rounded shadow-sm">
      <h3 className="font-bold">{note.title}</h3>
      <p className="mb-2">{note.content}</p>

      {isOwner && (
        <button
          onClick={handleDelete}
          className="bg-red-500 text-white px-3 py-1 rounded"
        >
          Delete
        </button>
      )}
    </div>
  );
}