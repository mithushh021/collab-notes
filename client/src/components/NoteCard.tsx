import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

interface Owner {
  _id: string;
  name: string;
  email: string;
}

interface Note {
  _id: string;
  title: string;
  content: string;
  owner: Owner;
  collaborators: Owner[];
  updatedAt: string;
}

interface Props {
  note: Note;
  currentUserId: string;
  onDelete: (id: string) => void;
}

export default function NoteCard({ note, currentUserId, onDelete }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const isOwner = note.owner._id === currentUserId;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await API.delete(`/notes/${note._id}`);
      onDelete(note._id);
    } catch {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  const plainText = note.content.replace(/<[^>]*>/g, "").slice(0, 120);
  const timeAgo = new Date(note.updatedAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <div className="group relative bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/50 hover:border-violet-500/30 rounded-2xl p-5 transition-all duration-200">

      {/* ── Top row: badge + delete button side by side ── */}
      <div className="flex items-center justify-between mb-3">
        {/* Owner / Collaborator badge */}
        {isOwner ? (
          <span className="text-[10px] font-medium bg-violet-500/15 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-full">
            Owner
          </span>
        ) : (
          <span className="text-[10px] font-medium bg-teal-500/15 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded-full">
            Collaborator
          </span>
        )}

        {/* Delete button — owner only, sits right of badge, never overlaps */}
        {isOwner && (
          <div>
            {!showConfirm ? (
              <button
                onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }}
                className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            ) : (
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-xl p-1 shadow-lg"
              >
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-[11px] font-medium text-red-400 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-400/10 transition-colors disabled:opacity-50"
                >
                  {deleting ? "..." : "Delete"}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="text-[11px] font-medium text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Clickable body ── */}
      <div onClick={() => navigate(`/notes/${note._id}`)} className="cursor-pointer">
        <h3 className="font-semibold text-white text-base leading-snug line-clamp-1 group-hover:text-violet-300 transition-colors mb-2">
          {note.title}
        </h3>

        <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 mb-4">
          {plainText || "No content yet..."}
        </p>

        {/* ── Bottom row: date + avatars ── */}
        <div className="flex items-center justify-between">
          <span className="text-slate-600 text-xs">{timeAgo}</span>

          {note.collaborators.length > 0 && (
            <div className="flex items-center gap-1">
              <div className="flex -space-x-1.5">
                {note.collaborators.slice(0, 3).map((c) => (
                  <div
                    key={c._id}
                    title={c.name}
                    className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 border-2 border-slate-800 flex items-center justify-center text-[9px] font-bold text-white"
                  >
                    {c.name[0].toUpperCase()}
                  </div>
                ))}
              </div>
              {note.collaborators.length > 3 && (
                <span className="text-slate-500 text-xs">+{note.collaborators.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}