import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data } = await API.post("/auth/login", {
        email,
        password,
      });

      login(data.token);
      localStorage.setItem("token", data.token);
window.location.href = "/dashboard";
      navigate("/dashboard");
    } catch (error) {
      alert("Login failed");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <form onSubmit={handleLogin} className="bg-white p-6 rounded shadow w-80">
        <h2 className="text-xl mb-4">Login</h2>

        <input
          className="w-full mb-3 p-2 border"
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full mb-3 p-2 border"
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="w-full bg-blue-500 text-white p-2">
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;