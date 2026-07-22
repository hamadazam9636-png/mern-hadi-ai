import axios from "axios";

// YEH FUNCTION UPDATE KAREIN:
const getBaseURL = () => {
  // Agar browser ka URL localhost hai, toh local backend use kare
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:5000/api";
  }
  // Vercel par live hone ke baad yeh hamesha production route use karega
  return "/api";
};

const API = axios.create({
  baseURL: getBaseURL(),
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("hadi_ai_token") || localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;