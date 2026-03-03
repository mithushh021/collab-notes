import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";

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
  createdAt: string;
}

export default function NoteEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Edit state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [isEditing, setIsEditing] = useState(false);

  // Collaborator state
  const [collabEmail, setCollabEmail] = useState("");
  const [collabLoading, setCollabLoading] = useState(false);
  const [collabError, setCollabError] = useState("");
  const [collabSuccess, setCollabSuccess] = useState("");
  const [showCollabPanel, setShowCollabPanel] = useState(false);

  // Auto-save timer
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const { data } = await API.get(`/notes/${id}`);
        setNote(data);
        setTitle(data.title);
        setContent(data.content);
      } catch (err: any) {
        if (err?.response?.status === 404 || err?.response?.status === 403) {
          setNotFound(true);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchNote();
  }, [id]);

  const isOwner = note?.owner._id === user?._id;

  // Auto-save 1.5s after user stops typing
  const handleContentChange = (val: string) => {
    setContent(val);
    setSaveStatus("idle");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => triggerSave(title, val), 1500);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setSaveStatus("idle");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => triggerSave(val, content), 1500);
  };

  const triggerSave = async (t: string, c: string) => {
    if (!t.trim()) return;
    setSaving(true);
    try {
      const { data } = await API.put(`/notes/${id}`, { title: t, content: c });
      setNote(data);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddCollaborator = async () => {
    setCollabError("");
    setCollabSuccess("");
    if (!collabEmail.trim()) return;
    setCollabLoading(true);
    try {
      const { data } = await API.put(`/notes/${id}/collaborate`, { email: collabEmail });
      setNote((prev) =>
        prev ? { ...prev, collaborators: [...prev.collaborators, data.collaborator] } : prev
      );
      setCollabSuccess(`${data.collaborator.name} added as collaborator`);
      setCollabEmail("");
      setTimeout(() => setCollabSuccess(""), 3000);
    } catch (err: any) {
      setCollabError(err?.response?.data?.message || "Failed to add collaborator");
    } finally {
      setCollabLoading(false);
    }
  };

  const handleRemoveCollaborator = async (userId: string) => {
    try {
      await API.delete(`/notes/${id}/collaborate/${userId}`);
      setNote((prev) =>
        prev ? { ...prev, collaborators: prev.collaborators.filter((c) => c._id !== userId) } : prev
      );
    } catch {
      // silent
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric",
      year: "numeric", hour: "2-digit", minute: "2-digit",
    });

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading note...</p>
        </div>
      </div>
    );
  }

  // ── Not found / No access ─────────────────────────────────
  if (notFound || !note) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-white font-semibold text-lg mb-2">Note not found</h2>
          <p className="text-slate-500 text-sm mb-6">This note doesn't exist or you don't have access.</p>
          <button onClick={() => navigate("/dashboard")}
            className="bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 rounded-xl text-sm transition-colors">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Main Editor ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">

      {/* Top navbar */}
      <header className="sticky top-0 z-20 bg-slate-900/90 backdrop-blur border-b border-slate-700/50 px-6 py-3">
        <div className="flex items-center gap-4">

          {/* Back */}
          <button onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm group">
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          <div className="w-px h-5 bg-slate-700" />

          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <span className="font-semibold text-white text-sm">NoteCraft</span>
          </div>

          <div className="flex-1" />

          {/* Save status */}
          <div className="flex items-center gap-2 text-xs">
            {saving && (
              <span className="flex items-center gap-1.5 text-slate-400">
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </span>
            )}
            {!saving && saveStatus === "saved" && (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Saved
              </span>
            )}
            {!saving && saveStatus === "error" && (
              <span className="flex items-center gap-1.5 text-red-400">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
                </svg>
                Save failed
              </span>
            )}
          </div>

          {/* Edit toggle */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
              isEditing
                ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                : "bg-slate-800 text-slate-400 border border-slate-700 hover:text-white hover:border-slate-600"
            }`}
          >
            {isEditing ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Done
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </>
            )}
          </button>

          {/* Collaborators button — owner only */}
          {isOwner && (
            <button
              onClick={() => setShowCollabPanel(!showCollabPanel)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${
                showCollabPanel
                  ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
                  : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:border-slate-600"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden sm:inline">Collaborators</span>
              {note.collaborators.length > 0 && (
                <span className="bg-indigo-500/30 text-indigo-300 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {note.collaborators.length}
                </span>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Editor area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-10">

            {/* Meta */}
            <div className="flex items-center gap-3 mb-8">
              {isOwner ? (
                <span className="text-[11px] font-medium bg-violet-500/15 text-violet-400 border border-violet-500/20 px-2.5 py-1 rounded-full">
                  Owner
                </span>
              ) : (
                <span className="text-[11px] font-medium bg-teal-500/15 text-teal-400 border border-teal-500/20 px-2.5 py-1 rounded-full">
                  Collaborator
                </span>
              )}
              <span className="text-slate-600 text-xs">
                Last updated {formatDate(note.updatedAt)}
              </span>
            </div>

            {/* Title */}
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Note title..."
                className="w-full bg-transparent text-white text-3xl font-bold placeholder-slate-700 focus:outline-none border-b border-slate-700/50 focus:border-violet-500/50 pb-4 mb-8 transition-colors"
              />
            ) : (
              <h1 className="text-3xl font-bold text-white pb-4 mb-8 border-b border-slate-700/30">
                {title || <span className="text-slate-700">Untitled</span>}
              </h1>
            )}

            {/* Content */}
            {isEditing ? (
              <textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Start writing your note..."
                className="w-full min-h-[60vh] bg-transparent text-slate-300 text-base leading-relaxed placeholder-slate-700 focus:outline-none resize-none"
              />
            ) : (
              <div className="text-slate-300 text-base leading-relaxed whitespace-pre-wrap min-h-[60vh]">
                {content || (
                  <span className="text-slate-700 italic">
                    No content yet. Click Edit to start writing.
                  </span>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Collaborators panel */}
        {showCollabPanel && isOwner && (
          <aside className="w-80 border-l border-slate-700/50 bg-slate-800/40 overflow-y-auto flex flex-col">
            <div className="p-5 border-b border-slate-700/50">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-white font-semibold text-sm">Collaborators</h3>
                <button onClick={() => setShowCollabPanel(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-all">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-slate-500 text-xs">Invite people to view and edit this note</p>
            </div>

            {/* Add collaborator */}
            <div className="p-5 border-b border-slate-700/50">
              <label className="block text-xs font-medium text-slate-400 mb-2">Invite by email</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={collabEmail}
                  onChange={(e) => { setCollabEmail(e.target.value); setCollabError(""); setCollabSuccess(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCollaborator()}
                  className="flex-1 bg-slate-900/60 border border-slate-600/60 text-white placeholder-slate-600 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-violet-500/60 transition-all"
                />
                <button onClick={handleAddCollaborator} disabled={collabLoading || !collabEmail.trim()}
                  className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-3 py-2.5 rounded-xl transition-colors">
                  {collabLoading ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                </button>
              </div>

              {collabError && (
                <p className="mt-2 text-xs text-red-400 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {collabError}
                </p>
              )}
              {collabSuccess && (
                <p className="mt-2 text-xs text-emerald-400 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {collabSuccess}
                </p>
              )}
            </div>

            {/* Collaborator list */}
            <div className="flex-1 p-5">
              {/* Owner */}
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Members</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-900/40 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {note.owner.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{note.owner.name}</p>
                    <p className="text-slate-500 text-xs truncate">{note.owner.email}</p>
                  </div>
                  <span className="text-[10px] bg-violet-500/15 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-full shrink-0">
                    Owner
                  </span>
                </div>

                {note.collaborators.length === 0 && (
                  <p className="text-slate-600 text-xs text-center py-4">No collaborators yet</p>
                )}

                {note.collaborators.map((c) => (
                  <div key={c._id} className="flex items-center gap-3 px-3 py-2.5 bg-slate-900/40 rounded-xl group/item">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {c.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{c.name}</p>
                      <p className="text-slate-500 text-xs truncate">{c.email}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveCollaborator(c._id)}
                      className="opacity-0 group-hover/item:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all shrink-0"
                      title="Remove collaborator"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}