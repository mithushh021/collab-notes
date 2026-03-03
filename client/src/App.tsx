import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NoteEditor from "./pages/NoteEditor";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        {/* ✅ This was missing — note view/edit page */}
        <Route path="/notes/:id" element={
          <ProtectedRoute><NoteEditor /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;