import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await API.post("/auth/register", {
        name,
        email,
        password,
      });

      navigate("/");
    } catch {
      alert("Registration failed");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <form className="bg-white p-6 rounded shadow w-80" onSubmit={handleRegister}>
        <h2 className="text-xl mb-4">Register</h2>

        <input
          className="w-full mb-3 p-2 border"
          placeholder="Name"
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="w-full mb-3 p-2 border"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full mb-3 p-2 border"
          placeholder="Password"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="w-full bg-green-500 text-white p-2">
          Register
        </button>
      </form>
    </div>
  );
};

export default Register;