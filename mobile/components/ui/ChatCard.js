import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS, RADIUS } from "../../constants/theme";
import { formatTime } from "../../utils/chat";
import Avatar from "./Avatar";

export default function ChatCard({ user, lastMessage, online = false, unreadCount = 0, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
    >
      <Avatar label={user.username} online={online} source={user.avatar_url} size={54} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text numberOfLines={1} style={styles.name}>@{user.username}</Text>
          <Text style={styles.time}>{formatTime(lastMessage?.createdAt)}</Text>
        </View>
        <View style={styles.bottomRow}>
          <Text numberOfLines={1} style={styles.preview}>
            {lastMessage?.text || "Tap to start the conversation"}
          </Text>
          {unreadCount ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  pressed: {
    transform: [{ scale: 0.99 }],
  },
  content: {
    flex: 1,
    gap: 7,
    minWidth: 0,
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  bottomRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  name: {
    color: COLORS.text,
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
  },
  time: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  preview: {
    color: COLORS.muted,
    flex: 1,
    fontSize: 13,
  },
  badge: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 22,
    minWidth: 22,
    paddingHorizontal: 7,
  },
  badgeText: {
    color: "#03110A",
    fontSize: 12,
    fontWeight: "900",
  },
});
