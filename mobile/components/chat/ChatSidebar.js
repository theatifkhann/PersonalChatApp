import React, { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  ACCENT,
  BORDER,
  SURFACE_ELEVATED,
  SURFACE_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "../../constants/theme";
import { buildAvatarFallback } from "../../utils/chat";

export default function ChatSidebar({
  availableUsers,
  incomingRequests,
  outgoingRequests,
  discoverableUsers,
  isWideLayout,
  refreshingUsers,
  selectedUserId,
  setSelectedUserId,
  unreadCounts,
  loadUsers,
  friendActionKey,
  sendFriendRequest,
  acceptFriendRequest,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const matchesUsername = (username) => {
    if (!normalizedSearchQuery) {
      return true;
    }

    return username.toLowerCase().includes(normalizedSearchQuery);
  };

  const filteredIncomingRequests = useMemo(
    () => incomingRequests.filter((request) => matchesUsername(request.user.username)),
    [incomingRequests, normalizedSearchQuery],
  );
  const filteredOutgoingRequests = useMemo(
    () => outgoingRequests.filter((request) => matchesUsername(request.user.username)),
    [outgoingRequests, normalizedSearchQuery],
  );
  const filteredFriends = useMemo(
    () => availableUsers.filter((user) => matchesUsername(user.username)),
    [availableUsers, normalizedSearchQuery],
  );
  const filteredDiscoverableUsers = useMemo(
    () => discoverableUsers.filter((user) => matchesUsername(user.username)),
    [discoverableUsers, normalizedSearchQuery],
  );
  const hasSearchResults =
    filteredIncomingRequests.length > 0 ||
    filteredOutgoingRequests.length > 0 ||
    filteredFriends.length > 0 ||
    filteredDiscoverableUsers.length > 0;

  return (
    <View style={[styles.sidebar, !isWideLayout ? styles.sidebarStacked : null]}>
      <View style={styles.sidebarHeader}>
        <Text style={styles.sidebarTitle}>Chats</Text>
        <Pressable onPress={() => loadUsers()} disabled={refreshingUsers}>
          <Text style={styles.refreshText}>
            {refreshingUsers ? "Refreshing..." : "Refresh"}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.sidebarHint}>
        Add people first, accept incoming requests, then chat with accepted friends here.
      </Text>

      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={setSearchQuery}
        placeholder="Search by username"
        placeholderTextColor={TEXT_SECONDARY}
        style={styles.searchInput}
        value={searchQuery}
      />

      {normalizedSearchQuery && !hasSearchResults ? (
        <View style={styles.searchEmptyState}>
          <Text style={styles.emptyStateTitle}>No matches found</Text>
          <Text style={styles.emptyStateText}>
            Try a different username search.
          </Text>
        </View>
      ) : null}

      {filteredIncomingRequests.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Incoming Requests</Text>
          {filteredIncomingRequests.map((request) => (
            <View key={request.request_id} style={styles.requestCard}>
              <View style={styles.requestMeta}>
                <Text style={styles.contactName}>@{request.user.username}</Text>
                <Text style={styles.contactSubtext}>Wants to connect</Text>
              </View>
              <Pressable
                disabled={friendActionKey === `accept-${request.request_id}`}
                onPress={() => acceptFriendRequest(request.request_id, request.user.user_id)}
                style={styles.actionButton}
              >
                <Text style={styles.actionButtonText}>
                  {friendActionKey === `accept-${request.request_id}` ? "Accepting..." : "Accept"}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      {filteredOutgoingRequests.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending</Text>
          {filteredOutgoingRequests.map((request) => (
            <View key={request.request_id} style={styles.requestCard}>
              <View style={styles.requestMeta}>
                <Text style={styles.contactName}>@{request.user.username}</Text>
                <Text style={styles.contactSubtext}>Request sent</Text>
              </View>
              <Text style={styles.pendingBadge}>Pending</Text>
            </View>
          ))}
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Friends</Text>

      <ScrollView
        horizontal={!isWideLayout}
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={
          isWideLayout ? styles.contactList : styles.contactListHorizontal
        }
      >
        {filteredFriends.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>
              {normalizedSearchQuery ? "No matching friends" : "No friends yet"}
            </Text>
            <Text style={styles.emptyStateText}>
              {normalizedSearchQuery
                ? "Try another username search."
                : "Send a request below or accept one above to start chatting."}
            </Text>
          </View>
        ) : filteredFriends.map((user) => {
          const isSelected = user.user_id === selectedUserId;
          const unreadCount = unreadCounts[user.user_id] || 0;

          return (
            <Pressable
              key={user.user_id}
              onPress={() => setSelectedUserId(user.user_id)}
              style={[
                styles.contactCard,
                isSelected ? styles.contactCardSelected : null,
              ]}
            >
              {user.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.contactAvatar} />
              ) : (
                <View style={styles.contactAvatarFallback}>
                  <Text style={styles.contactAvatarText}>
                    {buildAvatarFallback(user.username)}
                  </Text>
                </View>
              )}

              <View style={styles.contactMeta}>
                <Text style={styles.contactName}>@{user.username}</Text>
                <Text style={styles.contactSubtext}>User #{user.user_id}</Text>
              </View>

              {unreadCount ? (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Discover</Text>
        {filteredDiscoverableUsers.length === 0 ? (
          <Text style={styles.emptyDiscoverText}>
            {normalizedSearchQuery
              ? "No users match that username."
              : "No new people to add right now."}
          </Text>
        ) : (
          filteredDiscoverableUsers.map((user) => (
            <View key={user.user_id} style={styles.requestCard}>
              <View style={styles.requestMeta}>
                <Text style={styles.contactName}>@{user.username}</Text>
                <Text style={styles.contactSubtext}>User #{user.user_id}</Text>
              </View>
              <Pressable
                disabled={friendActionKey === `send-${user.user_id}`}
                onPress={() => sendFriendRequest(user.user_id)}
                style={styles.actionButtonSecondary}
              >
                <Text style={styles.actionButtonTextSecondary}>
                  {friendActionKey === `send-${user.user_id}` ? "Sending..." : "Add"}
                </Text>
              </Pressable>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: SURFACE_ELEVATED,
    borderColor: BORDER,
    borderRadius: 24,
    borderWidth: 1,
    minWidth: 280,
    padding: 16,
  },
  sidebarStacked: {
    minWidth: 0,
  },
  sidebarHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sidebarTitle: {
    color: TEXT_PRIMARY,
    fontSize: 22,
    fontWeight: "800",
  },
  refreshText: {
    color: ACCENT,
    fontSize: 13,
    fontWeight: "700",
  },
  sidebarHint: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
    marginTop: 8,
  },
  searchInput: {
    backgroundColor: SURFACE_MUTED,
    borderColor: BORDER,
    borderRadius: 14,
    borderWidth: 1,
    color: TEXT_PRIMARY,
    fontSize: 14,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  section: {
    gap: 10,
    marginBottom: 14,
  },
  sectionTitle: {
    color: TEXT_PRIMARY,
    fontSize: 14,
    fontWeight: "800",
  },
  contactList: {
    gap: 10,
    paddingBottom: 8,
  },
  contactListHorizontal: {
    gap: 10,
  },
  contactCard: {
    alignItems: "center",
    backgroundColor: SURFACE_MUTED,
    borderColor: BORDER,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  contactCardSelected: {
    backgroundColor: "#173d33",
    borderColor: ACCENT,
  },
  contactAvatar: {
    borderRadius: 24,
    height: 48,
    width: 48,
  },
  contactAvatarFallback: {
    alignItems: "center",
    backgroundColor: "#21343d",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  contactAvatarText: {
    color: TEXT_PRIMARY,
    fontSize: 17,
    fontWeight: "800",
  },
  contactMeta: {
    flex: 1,
    gap: 3,
  },
  contactName: {
    color: TEXT_PRIMARY,
    fontSize: 15,
    fontWeight: "700",
  },
  contactSubtext: {
    color: TEXT_SECONDARY,
    fontSize: 12,
  },
  unreadBadge: {
    alignItems: "center",
    backgroundColor: ACCENT,
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 22,
    minWidth: 22,
    paddingHorizontal: 7,
  },
  unreadBadgeText: {
    color: "#08281f",
    fontSize: 12,
    fontWeight: "800",
  },
  requestCard: {
    alignItems: "center",
    backgroundColor: SURFACE_MUTED,
    borderColor: BORDER,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },
  requestMeta: {
    flex: 1,
    gap: 3,
  },
  actionButton: {
    backgroundColor: ACCENT,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionButtonSecondary: {
    backgroundColor: "#173d33",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionButtonText: {
    color: "#08281f",
    fontSize: 12,
    fontWeight: "800",
  },
  actionButtonTextSecondary: {
    color: TEXT_PRIMARY,
    fontSize: 12,
    fontWeight: "800",
  },
  pendingBadge: {
    color: ACCENT,
    fontSize: 12,
    fontWeight: "800",
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: SURFACE_MUTED,
    borderColor: BORDER,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  emptyStateTitle: {
    color: TEXT_PRIMARY,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4,
  },
  emptyStateText: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  emptyDiscoverText: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    lineHeight: 18,
  },
  searchEmptyState: {
    alignItems: "center",
    backgroundColor: SURFACE_MUTED,
    borderColor: BORDER,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16,
  },
});
