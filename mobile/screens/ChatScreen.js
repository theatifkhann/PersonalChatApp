import React, { useEffect, useState } from "react";

import useChatApp from "../hooks/useChatApp";
import LoginScreen from "./auth/LoginScreen";
import RegisterScreen from "./auth/RegisterScreen";
import SplashScreen from "./auth/SplashScreen";
import MainAppScreen from "./main/MainAppScreen";

export default function ChatScreen() {
  const [showSplash, setShowSplash] = useState(true);
  const chatApp = useChatApp();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setShowSplash(false);
    }, 1200);

    return () => clearTimeout(timeoutId);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  if (!chatApp.currentUser) {
    const AuthComponent = chatApp.authMode === "signup" ? RegisterScreen : LoginScreen;

    return (
      <AuthComponent
        {...chatApp}
        mode={chatApp.authMode}
        onSwitchMode={() =>
          chatApp.setAuthMode(chatApp.authMode === "signup" ? "login" : "signup")
        }
      />
    );
  }

  return <MainAppScreen chatApp={chatApp} />;
}
