import { useState } from "react";
import { THEMES } from "../constants";
import { useThemeStore } from "../store/useThemeStore";
import { useAuthStore } from "../store/useAuthStore";
import { ChevronRight, ArrowLeft, Palette, Bell, Shield, LogOut, Check, CheckCheck } from "lucide-react";
import { formatMessageTime } from "../lib/utils";

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();
  const { logout } = useAuthStore();
  const [activeView, setActiveView] = useState("main");

  const renderMainSettings = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-2xl font-bold">Settings</h2>
      </div>

      <div className="space-y-6">
        {/* Appearance Group */}
        <div className="bg-base-100 rounded-2xl shadow-sm border border-base-300 overflow-hidden">
          <button 
            onClick={() => setActiveView("theme")}
            className="w-full flex items-center justify-between p-4 hover:bg-base-200 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Palette className="size-5" />
              </div>
              <div className="text-left">
                <p className="font-medium">Appearance</p>
                <p className="text-xs text-base-content/60">Theme</p>
              </div>
            </div>
            <ChevronRight className="size-5 text-base-content/40" />
          </button>
        </div>

        {/* Notifications Group */}
        <div className="bg-base-100 rounded-2xl shadow-sm border border-base-300 overflow-hidden">
          <div className="w-full flex items-center justify-between p-4 opacity-70">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-base-300 rounded-lg text-base-content">
                <Bell className="size-5" />
              </div>
              <div className="text-left">
                <p className="font-medium">Notifications</p>
                <p className="text-xs text-base-content/60">Coming soon</p>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Group */}
        <div className="bg-base-100 rounded-2xl shadow-sm border border-base-300 overflow-hidden">
          <div className="w-full flex items-center justify-between p-4 opacity-70">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-base-300 rounded-lg text-base-content">
                <Shield className="size-5" />
              </div>
              <div className="text-left">
                <p className="font-medium">Privacy</p>
                <p className="text-xs text-base-content/60">Coming soon</p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Group */}
        <div className="bg-base-100 rounded-2xl shadow-sm border border-base-300 overflow-hidden">
          <button 
            onClick={logout}
            className="w-full flex items-center justify-between p-4 hover:bg-base-200 transition-colors text-error"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-error/10 rounded-lg">
                <LogOut className="size-5" />
              </div>
              <div className="text-left">
                <p className="font-medium">Logout</p>
                <p className="text-xs opacity-60">Log out of your account</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  const renderThemeSettings = () => (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => setActiveView("main")}
          className="btn btn-ghost btn-sm btn-circle"
          aria-label="Back to settings"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold">Appearance</h2>
          <p className="text-sm text-base-content/60">Choose a theme for your chat interface</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {THEMES.map((t) => (
          <button
            key={t}
            className={`
              group flex flex-col items-center gap-2 p-2 rounded-xl transition-all
              ${theme === t ? "bg-base-300 shadow-sm ring-2 ring-primary ring-offset-2 ring-offset-base-100" : "hover:bg-base-200/50"}
            `}
            onClick={() => setTheme(t)}
          >
            <div className="relative h-10 w-full rounded-lg overflow-hidden" data-theme={t}>
              <div className="absolute inset-0 grid grid-cols-4 gap-px p-1">
                <div className="rounded-md bg-primary"></div>
                <div className="rounded-md bg-secondary"></div>
                <div className="rounded-md bg-accent"></div>
                <div className="rounded-md bg-neutral"></div>
              </div>
            </div>
            <span className="text-xs font-medium block w-full text-center">
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </span>
          </button>
        ))}
      </div>

      {/* Preview Section */}
      <div className="mt-10">
        <h3 className="text-sm font-semibold mb-3 text-base-content/60 uppercase tracking-wider">Preview</h3>
        <div className="rounded-2xl border border-base-300 overflow-hidden shadow-sm bg-base-100/50 max-w-md mx-auto sm:mx-0">
          <div className="p-4 bg-base-200/50">
            {/* Mock Chat UI */}
            <div className="bg-base-100 rounded-xl shadow-sm overflow-hidden flex flex-col">
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-base-200 flex items-center gap-3">
                <div className="size-8 rounded-full bg-primary flex items-center justify-center text-primary-content font-medium text-sm">
                  J
                </div>
                <div>
                  <h3 className="font-semibold text-sm leading-tight">John Doe</h3>
                  <p className="text-[11px] text-base-content/60">Online</p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="p-4 space-y-4 bg-base-100/50">
                <div className="flex justify-center mb-2">
                  <span className="bg-base-300/80 text-base-content/70 text-[10px] px-2 py-0.5 rounded-full font-medium">
                    TODAY
                  </span>
                </div>
                
                <div className="chat chat-start">
                  <div className="chat-bubble flex flex-col p-2 px-3 relative max-w-[85%] bg-base-200 text-base-content shadow-sm text-sm" style={{ minWidth: "100px" }}>
                    <p className="mb-2">Hey! How's it going?</p>
                    <div className="flex items-center gap-1 text-[10px] absolute bottom-1 right-2 text-base-content/60">
                      <span>12:00</span>
                    </div>
                  </div>
                </div>

                <div className="chat chat-end">
                  <div className="chat-bubble flex flex-col p-2 px-3 relative max-w-[85%] bg-primary text-primary-content shadow-sm text-sm" style={{ minWidth: "100px" }}>
                    <p className="mb-2">I'm doing great! Just working on some new features.</p>
                    <div className="flex items-center gap-1 text-[10px] absolute bottom-1 right-2 text-primary-content/80">
                      <span>12:01</span>
                      <span className="flex items-center -mr-0.5"><CheckCheck className="size-3 text-blue-300" /></span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Chat Input Placeholder */}
              <div className="p-3 border-t border-base-200 bg-base-100">
                <div className="bg-base-200 rounded-full h-8 w-full border border-base-300"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-20 px-4 pb-10">
      {activeView === "main" ? renderMainSettings() : renderThemeSettings()}
    </div>
  );
};
export default SettingsPage;
