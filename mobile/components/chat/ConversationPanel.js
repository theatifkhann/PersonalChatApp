import React from "react";
import {
  Image,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  BUBBLE_INCOMING,
  BUBBLE_OUTGOING,
  BUBBLE_SYSTEM,
  BORDER,
  COMPOSER_DOCK_HEIGHT,
  SURFACE_ELEVATED,
  SURFACE_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  ACCENT,
} from "../../constants/theme";
import {
  buildAvatarFallback,
  formatTime,
  normalizeMessageKind,
} from "../../utils/chat";

export default function ConversationPanel({
  selectedUser,
  currentUser,
  historyLoading,
  conversationMessages,
  keyboardHeight,
  message,
  setMessage,
  sendMessage,
  error,
}) {
  return (
    <View style={styles.conversationPanel}>
      <View style={styles.conversationHeader}>
        {selectedUser ? (
          <>
            {selectedUser.avatar_url ? (
              <Image
                source={{ uri: selectedUser.avatar_url }}
                style={styles.conversationAvatar}
              />
            ) : (
              <View style={styles.conversationAvatarFallback}>
                <Text style={styles.contactAvatarText}>
                  {buildAvatarFallback(selectedUser.username)}
                </Text>
              </View>
            )}

            <View style={styles.conversationTitleGroup}>
              <Text style={styles.conversationTitle}>@{selectedUser.username}</Text>
              <Text style={styles.conversationSubtitle}>
                User #{selectedUser.user_id}
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.conversationTitleGroup}>
            <Text style={styles.conversationTitle}>Select a chat</Text>
            <Text style={styles.conversationSubtitle}>
              Choose someone from the left to load your message history.
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        keyboardShouldPersistTaps="handled"
        style={styles.messageScroller}
        contentContainerStyle={[
          styles.messageList,
          {
            paddingBottom:
              COMPOSER_DOCK_HEIGHT + keyboardHeight + (error ? 32 : 12),
          },
        ]}
      >
        {historyLoading ? (
          <Text style={styles.loadingText}>Loading conversation...</Text>
        ) : conversationMessages.length === 0 ? (
          <View style={styles.emptyConversation}>
            <Text style={styles.emptyConversationTitle}>No messages yet</Text>
            <Text style={styles.emptyConversationText}>
              Start the conversation with a message below.
            </Text>
          </View>
        ) : (
          conversationMessages.map((item) => {
            const kind = normalizeMessageKind(item, currentUser.user_id);

            return (
              <View
                key={item.id}
                style={[
                  styles.messageRow,
                  kind === "outgoing"
                    ? styles.messageRowOutgoing
                    : kind === "incoming"
                      ? styles.messageRowIncoming
                      : styles.messageRowCenter,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    kind === "outgoing"
                      ? styles.messageBubbleOutgoing
                      : kind === "incoming"
                        ? styles.messageBubbleIncoming
                        : styles.messageBubbleSystem,
                  ]}
                >
                  {kind === "system" || kind === "error" ? (
                    <Text style={styles.messageSystemLabel}>
                      {kind.toUpperCase()}
                    </Text>
                  ) : null}
                  <Text style={styles.messageText}>{item.text}</Text>
                  <Text style={styles.messageTime}>{formatTime(item.createdAt)}</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <View
        style={[
          styles.composerDock,
          {
            bottom: Platform.OS === "ios" ? keyboardHeight : 0,
          },
        ]}
      >
        <View style={styles.composer}>
          <TextInput
            editable={Boolean(selectedUser)}
            multiline
            onChangeText={setMessage}
            onSubmitEditing={Keyboard.dismiss}
            placeholder={
              selectedUser ? "Type a message" : "Choose a chat to start messaging"
            }
            placeholderTextColor={TEXT_SECONDARY}
            style={styles.composerInput}
            value={message}
          />
          <Pressable onPress={sendMessage} style={styles.sendButton}>
            <Text style={styles.sendButtonText}>Send</Text>
          </Pressable>
        </View>

        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  conversationPanel: {
    backgroundColor: SURFACE_ELEVATED,
    borderColor: BORDER,
    borderRadius: 24,
    borderWidth: 1,
    flex: 1,
    overflow: "hidden",
    position: "relative",
  },
  conversationHeader: {
    alignItems: "center",
    backgroundColor: SURFACE_MUTED,
    borderBottomColor: BORDER,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  conversationAvatar: {
    borderRadius: 22,
    height: 44,
    width: 44,
  },
  conversationAvatarFallback: {
    alignItems: "center",
    backgroundColor: "#21343d",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  contactAvatarText: {
    color: TEXT_PRIMARY,
    fontSize: 17,
    fontWeight: "800",
  },
  conversationTitleGroup: {
    flex: 1,
    gap: 3,
  },
  conversationTitle: {
    color: TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: "700",
  },
  conversationSubtitle: {
    color: TEXT_SECONDARY,
    fontSize: 12,
  },
  messageScroller: {
    backgroundColor: "#0b141a",
    flex: 1,
  },
  messageList: {
    gap: 10,
    padding: 16,
  },
  loadingText: {
    color: TEXT_SECONDARY,
    fontSize: 14,
    textAlign: "center",
  },
  emptyConversation: {
    alignItems: "center",
    backgroundColor: "#101d24",
    borderColor: BORDER,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 32,
    padding: 20,
  },
  emptyConversationTitle: {
    color: TEXT_PRIMARY,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptyConversationText: {
    color: TEXT_SECONDARY,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  messageRow: {
    flexDirection: "row",
  },
  messageRowOutgoing: {
    justifyContent: "flex-end",
  },
  messageRowIncoming: {
    justifyContent: "flex-start",
  },
  messageRowCenter: {
    justifyContent: "center",
  },
  messageBubble: {
    borderRadius: 18,
    gap: 8,
    maxWidth: "84%",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  messageBubbleOutgoing: {
    backgroundColor: BUBBLE_OUTGOING,
    borderTopRightRadius: 6,
  },
  messageBubbleIncoming: {
    backgroundColor: BUBBLE_INCOMING,
    borderTopLeftRadius: 6,
  },
  messageBubbleSystem: {
    backgroundColor: BUBBLE_SYSTEM,
    maxWidth: "100%",
  },
  messageSystemLabel: {
    color: ACCENT,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  messageText: {
    color: TEXT_PRIMARY,
    fontSize: 15,
    lineHeight: 21,
  },
  messageTime: {
    alignSelf: "flex-end",
    color: TEXT_SECONDARY,
    fontSize: 11,
  },
  composerDock: {
    left: 0,
    position: "absolute",
    right: 0,
  },
  composer: {
    alignItems: "flex-end",
    backgroundColor: SURFACE_MUTED,
    borderTopColor: BORDER,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 14,
  },
  composerInput: {
    backgroundColor: SURFACE_ELEVATED,
    borderColor: BORDER,
    borderRadius: 18,
    borderWidth: 1,
    color: TEXT_PRIMARY,
    flex: 1,
    fontSize: 15,
    maxHeight: 120,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingTop: 14,
    textAlignVertical: "top",
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: ACCENT,
    borderRadius: 18,
    justifyContent: "center",
    minHeight: 52,
    minWidth: 84,
    paddingHorizontal: 16,
  },
  sendButtonText: {
    color: "#08281f",
    fontSize: 15,
    fontWeight: "800",
  },
  errorBanner: {
    color: "#ff9f9f",
    fontSize: 13,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
