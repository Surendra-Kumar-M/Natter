import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";

import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useEffect } from "react";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { axiosInstance } from "./lib/axios.js";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, onlineUsers } = useAuthStore();
  const { theme } = useThemeStore();
  const location = useLocation();

  console.log({ onlineUsers });

  useEffect(() => {
    checkAuth();

    const interceptor = axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && !error.config.url.includes("/auth/check")) {
          useAuthStore.setState({ authUser: null });
          useAuthStore.getState().disconnectSocket();
          toast.error("Session expired. Please login again.");
        }
        return Promise.reject(error);
      }
    );

    return () => axiosInstance.interceptors.response.eject(interceptor);
  }, [checkAuth]);

  console.log({ authUser });

  useEffect(() => {
    const noIndexRoutes = ["/login", "/signup", "/profile", "/settings"];
    let metaRobots = document.querySelector('meta[name="robots"]');
    
    // If it's a noindex route OR it's the root '/' but the user is authenticated (authenticated chat content)
    const shouldNoIndex = noIndexRoutes.includes(location.pathname) || (location.pathname === "/" && authUser);

    if (shouldNoIndex) {
      if (!metaRobots) {
        metaRobots = document.createElement("meta");
        metaRobots.name = "robots";
        document.head.appendChild(metaRobots);
      }
      metaRobots.content = "noindex,nofollow";
    } else {
      if (metaRobots) {
        metaRobots.content = "index,follow";
      }
    }
  }, [location.pathname, authUser]);

  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );

  return (
    <div data-theme={theme}>
      <Navbar />

      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <LoginPage />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/" />} />
      </Routes>

      <Toaster />
    </div>
  );
};
export default App;
