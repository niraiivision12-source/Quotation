import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { login } from "@/api/auth.api";

import { useAuthStore } from "@/store/auth.store";

export default function LoginPage() {
  const navigate = useNavigate();

  const loginStore = useAuthStore((state) => state.login);

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await login(email, password);

    loginStore(response.data.token, response.data.user);

    navigate("/");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />

      <button type="submit">Login</button>
    </form>
  );
}
