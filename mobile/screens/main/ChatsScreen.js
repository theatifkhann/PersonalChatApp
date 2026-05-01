import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import ChatCard from "../../components/ui/ChatCard";
import SearchBar from "../../components/ui/SearchBar";
import { COLORS, RADIUS, SHADOW } from "../../constants/theme";

function getLastMessage(messages, currentUserId, peerId) {
  const items = messages.filter((item) => {
    if (item.kind === "system" || item.kind === "error") {
      return false;
    }
    return (
      (item.senderId === currentUserId && item.receiverId === peerId) ||
      (item.senderId === peerId && item.receiverId === currentUserId)
    );
  });
  return items[items.length - 1] || null;
}

export default function ChatsScreen({
  currentUser,
  friends,
  messages,
  unreadCounts,
  onlineUserIds,
  onOpenChat,
  refreshing,
  onRefresh,
}) {
  const [query, setQuery] = useState("");
  const filteredFriends = useMemo(
    () =>
      friends.filter((user) =>
        user.username.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [friends, query],
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Messages</Text>
          <Text style={styles.title}>Chats</Text>
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>Online</Text>
        </View>
      </View>

      <SearchBar onChangeText={setQuery} placeholder="Search conversations" value={query} />

      <FlatList
        contentContainerStyle={styles.list}
        data={filteredFriends}
        keyExtractor={(item) => String(item.user_id)}
        onRefresh={onRefresh}
        refreshing={refreshing}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No chats yet</Text>
            <Text style={styles.emptyText}>Add friends from Discover to start messaging.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <ChatCard
            lastMessage={getLastMessage(messages, currentUser.user_id, item.user_id)}
            online={onlineUserIds.has(item.user_id)}
            onPress={() => onOpenChat(item)}
            unreadCount={unreadCounts[item.user_id] || 0}
            user={item}
          />
        )}
      />

      <Pressable style={styles.fab}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: COLORS.background,
    flex: 1,
    gap: 16,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  eyebrow: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    color: COLORS.text,
    fontSize: 34,
    fontWeight: "900",
  },
  statusPill: {
    backgroundColor: "rgba(34,197,94,0.12)",
    borderColor: "rgba(34,197,94,0.24)",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
  },
  list: {
    gap: 10,
    paddingBottom: 112,
  },
  empty: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    marginTop: 30,
    padding: 24,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
  fab: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    bottom: 96,
    height: 58,
    justifyContent: "center",
    position: "absolute",
    right: 20,
    width: 58,
    ...SHADOW,
  },
  fabText: {
    color: "#03110A",
    fontSize: 30,
    fontWeight: "900",
    marginTop: -2,
  },
});
