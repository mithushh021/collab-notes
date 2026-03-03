const API_URL = "http://localhost:5000/api";

export const getToken = () => localStorage.getItem("token");

export const fetchNotes = async () => {
  const res = await fetch(`${API_URL}/notes`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  if (!res.ok) throw new Error("Failed to fetch notes");

  return res.json();
};

export const createNote = async (title: string, content: string) => {
  const res = await fetch(`${API_URL}/notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ title, content }),
  });

  if (!res.ok) throw new Error("Failed to create note");

  return res.json();
};