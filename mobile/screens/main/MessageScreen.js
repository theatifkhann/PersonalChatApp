import React from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import Avatar from "../../components/ui/Avatar";
import MessageBubble from "../../components/ui/MessageBubble";
import { COLORS, RADIUS, SHADOW } from "../../constants/theme";

export default function MessageScreen({
  currentUser,
  selectedUser,
  messages,
  historyLoading,
  keyboardHeight,
  message,
  online,
  setMessage,
  sendMessage,
  error,
  onBack,
}) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.iconButton}>
          <Text style={styles.iconText}>Back</Text>
        </Pressable>
        <Avatar label={selectedUser?.username} online={online} source={selectedUser?.avatar_url} size={44} />
        <View style={styles.headerText}>
          <Text numberOfLines={1} style={styles.name}>@{selectedUser?.username}</Text>
          <Text style={[styles.status, online ? styles.statusOnline : null]}>
            {online ? "online" : "offline"}
          </Text>
        </View>
      </View>

      <ScrollView
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        keyboardShouldPersistTaps="handled"
        style={styles.scroller}
        contentContainerStyle={[
          styles.messages,
          { paddingBottom: 120 + keyboardHeight + (error ? 24 : 0) },
        ]}
      >
        {historyLoading ? (
          <Text style={styles.loading}>Loading messages...</Text>
        ) : messages.length ? (
          <>
            {messages.map((item) => (
              <MessageBubble
                currentUserId={currentUser.user_id}
                key={item.id}
                message={item}
              />
            ))}
          </>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Say hello</Text>
            <Text style={styles.emptyText}>Messages are private between you and @{selectedUser?.username}.</Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.composerWrap, { bottom: Platform.OS === "ios" ? keyboardHeight : 0 }]}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.composer}>
          <Text style={styles.composerIcon}>+</Text>
          <Text style={styles.composerIcon}>:</Text>
          <TextInput
            multiline
            onChangeText={setMessage}
            onSubmitEditing={Keyboard.dismiss}
            placeholder="Message"
            placeholderTextColor={COLORS.muted}
            style={styles.input}
            value={message}
          />
          <Text style={styles.composerIcon}>M</Text>
          <Pressable onPress={sendMessage} style={styles.send}>
            <Text style={styles.sendText}>Send</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  header: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  iconButton: {
    alignItems: "center",
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 10,
  },
  iconText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
  },
  status: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  statusOnline: {
    color: COLORS.primary,
  },
  scroller: {
    flex: 1,
  },
  messages: {
    gap: 10,
    padding: 16,
  },
  loading: {
    color: COLORS.muted,
    textAlign: "center",
  },
  empty: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    marginTop: 40,
    padding: 24,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
  },
  emptyText: {
    color: COLORS.muted,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
  composerWrap: {
    left: 0,
    padding: 12,
    position: "absolute",
    right: 0,
  },
  composer: {
    alignItems: "flex-end",
    backgroundColor: "rgba(17,24,39,0.96)",
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    padding: 8,
    ...SHADOW,
  },
  composerIcon: {
    color: COLORS.muted,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 40,
    minWidth: 22,
    textAlign: "center",
  },
  input: {
    color: COLORS.text,
    flex: 1,
    fontSize: 15,
    maxHeight: 110,
    minHeight: 40,
    paddingTop: 10,
  },
  send: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 14,
  },
  sendText: {
    color: "#03110A",
    fontSize: 13,
    fontWeight: "900",
  },
  error: {
    color: COLORS.danger,
    fontSize: 12,
    marginBottom: 8,
    paddingHorizontal: 6,
  },
});
