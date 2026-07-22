import React, { useState } from "react";
import API from "../api";

export default function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isLogin ? "/auth/login" : "/auth/register";

    try {
      const res = await API.post(endpoint, formData);
      if (res.data.success) {
        const userDataWithToken = {
          ...res.data.user,
          token: res.data.token
        };

        localStorage.setItem("hadi_ai_token", res.data.token);
        localStorage.setItem("hadi_ai_logged_in_user", JSON.stringify(userDataWithToken));
        
        onAuthSuccess(userDataWithToken);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Hadi-AI Workspace</h2>
          <p className="text-xs text-gray-500 mt-1">
            {isLogin ? "Sign in to access your MongoDB synced chat sessions" : "Create a new production account"}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                autoComplete="off"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                placeholder="Hadi"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="new-email"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-blue-500"
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all cursor-pointer disabled:bg-gray-300"
          >
            {loading ? "Authenticating..." : isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => { 
              setIsLogin(!isLogin); 
              setError(""); 
              setFormData({ name: "", email: "", password: "" });
            }}
            className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
          >
            {isLogin ? "Need an account? Register" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
}