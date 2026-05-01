import React, { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import UserCard from "../../components/ui/UserCard";
import { COLORS, RADIUS } from "../../constants/theme";

const FILTERS = [
  { key: "requests", label: "Requests" },
  { key: "friends", label: "Friends" },
  { key: "sent", label: "Sent" },
];

export default function FriendsScreen({
  friends,
  incomingRequests,
  outgoingRequests,
  acceptFriendRequest,
  friendActionKey,
  onOpenChat,
}) {
  const [activeFilter, setActiveFilter] = useState("requests");

  const data =
    activeFilter === "requests"
      ? incomingRequests
      : activeFilter === "sent"
        ? outgoingRequests
        : friends;

  return (
    <View style={styles.screen}>
      <View>
        <Text style={styles.eyebrow}>Connections</Text>
        <Text style={styles.title}>Friends</Text>
      </View>

      <View style={styles.tabs}>
        {FILTERS.map((filter) => {
          const active = activeFilter === filter.key;
          return (
            <Pressable
              key={filter.key}
              onPress={() => setActiveFilter(filter.key)}
              style={[styles.tab, active ? styles.tabActive : null]}
            >
              <Text style={[styles.tabText, active ? styles.tabTextActive : null]}>
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        contentContainerStyle={styles.list}
        data={data}
        keyExtractor={(item) =>
          String(item.request_id || item.user_id || item.user?.user_id)
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nothing here</Text>
            <Text style={styles.emptyText}>
              {activeFilter === "friends"
                ? "Accepted friends will show up here."
                : "Friend requests will appear as people connect with you."}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          if (activeFilter === "friends") {
            return (
              <UserCard
                actionLabel="Chat"
                onAction={() => onOpenChat(item)}
                subtitle={`User #${item.user_id}`}
                user={item}
              />
            );
          }

          const requestUser = item.user;
          const incoming = activeFilter === "requests";
          return (
            <UserCard
              actionLabel={
                incoming
                  ? friendActionKey === `accept-${item.request_id}`
                    ? "Accepting"
                    : "Accept"
                  : "Pending"
              }
              disabled={!incoming || friendActionKey === `accept-${item.request_id}`}
              onAction={
                incoming
                  ? () => acceptFriendRequest(item.request_id, requestUser.user_id)
                  : undefined
              }
              subtitle={incoming ? "Wants to connect" : "Request sent"}
              user={requestUser}
            />
          );
        }}
      />
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
  tabs: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    flexDirection: "row",
    padding: 4,
  },
  tab: {
    alignItems: "center",
    borderRadius: RADIUS.md,
    flex: 1,
    minHeight: 42,
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: "rgba(34,197,94,0.14)",
  },
  tabText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "800",
  },
  tabTextActive: {
    color: COLORS.text,
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
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center",
  },
});
