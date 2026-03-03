import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import NoteCard from "../components/NoteCard";
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
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  // ✅ Search state — properly separated
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Note[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const { data } = await API.get("/notes");
        setNotes(data);
      } catch {
        // handled by axios interceptor
      } finally {
        setLoading(false);
      }
    };
    loadNotes();
  }, []);

  // ✅ FIX: proper search function with error handling
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults(null);
      setSearchError("");
      return;
    }

    setSearching(true);
    setSearchError("");

    try {
      const { data } = await API.get(`/notes/search?q=${encodeURIComponent(query.trim())}`);
      setSearchResults(data);
    } catch (err: any) {
      // ✅ Show actual error so you know what went wrong
      setSearchError(err?.response?.data?.message || "Search failed. Try again.");
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // ✅ FIX: debounce — auto-search 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
    setSearchError("");
  };

  const handleCreate = async () => {
    setCreateError("");
    if (!title.trim() || !content.trim()) {
      setCreateError("Title and content are required.");
      return;
    }
    setCreating(true);
    try {
      const { data } = await API.post("/notes", { title, content });
      setNotes((prev) => [data, ...prev]);
      setTitle("");
      setContent("");
      setShowCreate(false);
    } catch (err: any) {
      setCreateError(err?.response?.data?.message || "Failed to create note.");
    } finally {
      setCreating(false);
    }
  };

  const displayedNotes = searchResults !== null ? searchResults : notes;
  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen bg-slate-900">

      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-slate-800/60 backdrop-blur border-r border-slate-700/50 flex flex-col z-20">
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <span className="font-bold text-white text-lg tracking-tight">NoteCraft</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-medium">All Notes</span>
            <span className="ml-auto text-xs bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full">
              {notes.length}
            </span>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-700/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-sm font-bold text-white">
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-slate-500 text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-64 flex flex-col min-h-screen">

        {/* Header */}
        <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur border-b border-slate-700/50 px-8 py-4">
          <div className="flex items-center gap-4">

            {/* ✅ Search bar — auto-searches on type */}
            <div className="flex-1 relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                {searching ? (
                  <svg className="w-4 h-4 text-violet-400 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </div>
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
              />
              {/* ✅ Clear button */}
              {searchQuery && (
                <button onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* New note */}
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-violet-500/20 hover:-translate-y-0.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Note
            </button>
          </div>

          {/* ✅ Search error shown below search bar */}
          {searchError && (
            <div className="mt-3 flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {searchError}
            </div>
          )}
        </header>

        {/* Body */}
        <main className="flex-1 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-white">
                {isSearching ? `Results for "${searchQuery}"` : "All Notes"}
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">
                {searching
                  ? "Searching..."
                  : `${displayedNotes.length} ${displayedNotes.length === 1 ? "note" : "notes"}`}
              </p>
            </div>
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-slate-800/40 border border-slate-700/30 rounded-2xl p-5 animate-pulse">
                  <div className="h-4 bg-slate-700 rounded-lg w-3/4 mb-3" />
                  <div className="h-3 bg-slate-700/60 rounded w-full mb-2" />
                  <div className="h-3 bg-slate-700/60 rounded w-2/3" />
                </div>
              ))}
            </div>
          )}

          {/* Empty states */}
          {!loading && !searching && displayedNotes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              {isSearching ? (
                <>
                  <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="text-slate-400 font-medium">No results found</p>
                  <p className="text-slate-600 text-sm mt-1">Try different keywords</p>
                  <button onClick={clearSearch}
                    className="mt-4 text-violet-400 hover:text-violet-300 text-sm transition-colors">
                    Clear search
                  </button>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-slate-400 font-medium">No notes yet</p>
                  <p className="text-slate-600 text-sm mt-1">Create your first note to get started</p>
                  <button onClick={() => setShowCreate(true)}
                    className="mt-4 flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-sm transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create note
                  </button>
                </>
              )}
            </div>
          )}

          {/* Notes grid */}
          {!loading && displayedNotes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {displayedNotes.map((note) => (
                <NoteCard
                  key={note._id}
                  note={note}
                  currentUserId={user?._id || ""}
                  onDelete={(id) => setNotes((prev) => prev.filter((n) => n._id !== id))}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Create Note Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700/60 rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
              <h2 className="text-white font-semibold text-lg">New Note</h2>
              <button onClick={() => { setShowCreate(false); setCreateError(""); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {createError && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-3 text-sm">
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {createError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                <input type="text" placeholder="Note title..." value={title}
                  onChange={(e) => setTitle(e.target.value)} autoFocus
                  className="w-full bg-slate-900/60 border border-slate-600/60 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-violet-500/60 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Content</label>
                <textarea placeholder="Start writing..." value={content}
                  onChange={(e) => setContent(e.target.value)} rows={5}
                  className="w-full bg-slate-900/60 border border-slate-600/60 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-violet-500/60 transition-all resize-none" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 pb-6">
              <button onClick={() => { setShowCreate(false); setCreateError(""); }}
                className="px-4 py-2.5 text-slate-400 hover:text-white border border-slate-600/60 hover:border-slate-500 rounded-xl text-sm transition-all hover:bg-slate-700/40">
                Cancel
              </button>
              <button onClick={handleCreate} disabled={creating}
                className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-violet-500/20">
                {creating ? (
                  <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Creating...</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Create Note</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}