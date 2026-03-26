import React from "react";
import { useWindowDimensions } from "react-native";

import useChatApp from "../hooks/useChatApp";
import AuthenticationScreen from "./AuthenticationScreen";
import ChatHomeScreen from "./ChatHomeScreen";

export default function ChatScreen() {
  const { width } = useWindowDimensions();
  const isWideLayout = width >= 860;
  const chatApp = useChatApp();

  if (!chatApp.currentUser) {
    return <AuthenticationScreen {...chatApp} />;
  }

  return <ChatHomeScreen {...chatApp} isWideLayout={isWideLayout} />;
}
