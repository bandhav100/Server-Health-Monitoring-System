import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, ShieldCheck } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const admins = [
    {
      username: "admin1",
      password: "admin123",
      name: "Admin 1",
    },
    {
      username: "admin2",
      password: "admin123",
      name: "Admin 2",
    },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const admin = admins.find(
      (user) =>
        user.username === username &&
        user.password === password
    );

    if (admin) {
      localStorage.setItem("loggedIn", "true");
      localStorage.setItem("adminName", admin.name);

      navigate("/dashboard");
    } else {
      setError("Invalid Username or Password");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-xl bg-card p-8 shadow-xl"
      >
        <div className="mb-8 text-center">
          <ShieldCheck className="mx-auto mb-3 h-12 w-12 text-primary" />
          <h1 className="text-3xl font-bold text-white">
            SHMS Login
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Server Health Monitoring System
          </p>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm text-gray-300">
            Username
          </label>

          <div className="relative">
            <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />

            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-slate-900 py-3 pl-10 pr-4 text-white outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm text-gray-300">
            Password
          </label>

          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />

            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-slate-900 py-3 pl-10 pr-4 text-white outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {error && (
          <p className="mb-4 text-center text-sm text-red-500">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          Login
        </button>

        <div className="mt-6 rounded-lg bg-slate-900 p-4 text-sm text-gray-400">
          <p className="font-semibold text-white">Demo Accounts</p>

          <p>Username: admin1</p>
          <p>Password: admin123</p>

          <hr className="my-2 border-gray-700" />

          <p>Username: admin2</p>
          <p>Password: admin123</p>
        </div>
      </form>
    </div>
  );
}