import React, { useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import SearchBar from "../../components/ui/SearchBar";
import UserCard from "../../components/ui/UserCard";
import { COLORS, RADIUS } from "../../constants/theme";

export default function DiscoverScreen({
  discoverableUsers,
  userSearchResults,
  searchingUsers,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  friendActionKey,
}) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(query);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [query, searchUsers]);

  const results = useMemo(
    () => (query.trim() ? userSearchResults : discoverableUsers),
    [discoverableUsers, query, userSearchResults],
  );

  const actionForUser = (user) => {
    if (user.relationship === "incoming") {
      return {
        disabled: friendActionKey === `accept-${user.request_id}`,
        label: friendActionKey === `accept-${user.request_id}` ? "Accepting" : "Accept",
        onPress: () => acceptFriendRequest(user.request_id, user.user_id),
        subtitle: "Sent you a request",
      };
    }
    if (user.relationship === "outgoing") {
      return { disabled: true, label: "Pending", onPress: undefined, subtitle: "Request sent" };
    }
    if (user.relationship === "friend") {
      return { disabled: true, label: "Friend", onPress: undefined, subtitle: "Already connected" };
    }
    return {
      disabled: friendActionKey === `send-${user.user_id}`,
      label: friendActionKey === `send-${user.user_id}` ? "Sending" : "Add",
      onPress: () => sendFriendRequest(user.user_id),
      subtitle: "Suggested user",
    };
  };

  return (
    <View style={styles.screen}>
      <View>
        <Text style={styles.eyebrow}>Find people</Text>
        <Text style={styles.title}>Discover</Text>
      </View>
      <SearchBar onChangeText={setQuery} placeholder="Search username" value={query} />

      <FlatList
        contentContainerStyle={styles.list}
        data={results}
        keyExtractor={(item) => String(item.user_id)}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{searchingUsers ? "Searching..." : "No users found"}</Text>
            <Text style={styles.emptyText}>Try another username or check back later.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const action = actionForUser(item);
          return (
            <UserCard
              actionLabel={action.label}
              disabled={action.disabled}
              onAction={action.onPress}
              subtitle={action.subtitle}
              user={item}
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
