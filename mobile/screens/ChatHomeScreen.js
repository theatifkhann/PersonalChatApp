import React from "react";
import {
  Image,
  Keyboard,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import ChatSidebar from "../components/chat/ChatSidebar";
import ConversationPanel from "../components/chat/ConversationPanel";
import {
  ACCENT,
  BORDER,
  SURFACE,
  SURFACE_ELEVATED,
  SURFACE_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "../constants/theme";
import { buildAvatarFallback } from "../utils/chat";

export default function ChatHomeScreen({
  currentUser,
  connectionStatus,
  logout,
  isWideLayout,
  availableUsers,
  incomingRequests,
  outgoingRequests,
  discoverableUsers,
  refreshingUsers,
  selectedUserId,
  setSelectedUserId,
  unreadCounts,
  loadUsers,
  friendActionKey,
  sendFriendRequest,
  acceptFriendRequest,
  selectedUser,
  historyLoading,
  conversationMessages,
  keyboardHeight,
  message,
  setMessage,
  sendMessage,
  error,
}) {
  const chatHomeContent = (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.appShell}>
        <View style={styles.topBar}>
          <View style={styles.profileRow}>
            {currentUser.avatar_url ? (
              <Image source={{ uri: currentUser.avatar_url }} style={styles.avatarLarge} />
            ) : (
              <View style={styles.avatarFallbackLarge}>
                <Text style={styles.avatarFallbackText}>
                  {buildAvatarFallback(currentUser.username)}
                </Text>
              </View>
            )}
            <View style={styles.profileTextGroup}>
              <Text style={styles.profileName}>@{currentUser.username}</Text>
              <Text style={styles.profileMeta}>{currentUser.email}</Text>
            </View>
          </View>

          <View style={styles.topBarActions}>
            <Text style={styles.statusPill}>{connectionStatus}</Text>
            <Pressable onPress={logout} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Log Out</Text>
            </Pressable>
          </View>
        </View>

        <View
          style={[
            styles.chatFrame,
            isWideLayout ? styles.chatFrameWide : styles.chatFrameStacked,
          ]}
        >
          <ChatSidebar
            availableUsers={availableUsers}
            incomingRequests={incomingRequests}
            outgoingRequests={outgoingRequests}
            discoverableUsers={discoverableUsers}
            isWideLayout={isWideLayout}
            refreshingUsers={refreshingUsers}
            selectedUserId={selectedUserId}
            setSelectedUserId={setSelectedUserId}
            unreadCounts={unreadCounts}
            loadUsers={loadUsers}
            friendActionKey={friendActionKey}
            sendFriendRequest={sendFriendRequest}
            acceptFriendRequest={acceptFriendRequest}
          />

          <ConversationPanel
            selectedUser={selectedUser}
            currentUser={currentUser}
            historyLoading={historyLoading}
            conversationMessages={conversationMessages}
            keyboardHeight={keyboardHeight}
            message={message}
            setMessage={setMessage}
            sendMessage={sendMessage}
            error={error}
          />
        </View>
      </View>
    </SafeAreaView>
  );

  if (Platform.OS === "web") {
    return chatHomeContent;
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      {chatHomeContent}
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: SURFACE,
    flex: 1,
  },
  appShell: {
    flex: 1,
    padding: 12,
  },
  topBar: {
    alignItems: "center",
    backgroundColor: SURFACE_ELEVATED,
    borderColor: BORDER,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  profileRow: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    gap: 12,
  },
  avatarLarge: {
    borderRadius: 24,
    height: 48,
    width: 48,
  },
  avatarFallbackLarge: {
    alignItems: "center",
    backgroundColor: "#1b4f45",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  avatarFallbackText: {
    color: TEXT_PRIMARY,
    fontSize: 18,
    fontWeight: "800",
  },
  profileTextGroup: {
    gap: 2,
  },
  profileName: {
    color: TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: "700",
  },
  profileMeta: {
    color: TEXT_SECONDARY,
    fontSize: 13,
  },
  topBarActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  statusPill: {
    backgroundColor: "#173d33",
    borderRadius: 999,
    color: ACCENT,
    fontSize: 12,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
    textTransform: "capitalize",
  },
  secondaryButton: {
    backgroundColor: SURFACE_MUTED,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: "700",
  },
  chatFrame: {
    flex: 1,
    gap: 12,
  },
  chatFrameWide: {
    flexDirection: "row",
  },
  chatFrameStacked: {
    flexDirection: "column",
  },
});
