import React, { useState } from "react";

import AppShell from "../../components/ui/AppShell";
import BottomTabs from "../../navigation/BottomTabs";
import ChatsScreen from "./ChatsScreen";
import DiscoverScreen from "./DiscoverScreen";
import FriendsScreen from "./FriendsScreen";
import MessageScreen from "./MessageScreen";
import ProfileScreen from "./ProfileScreen";

export default function MainAppScreen({ chatApp }) {
  const [activeTab, setActiveTab] = useState("chats");
  const [chatOpen, setChatOpen] = useState(false);

  const openChat = (user) => {
    chatApp.setSelectedUserId(user.user_id);
    setActiveTab("chats");
    setChatOpen(true);
  };

  const changeTab = (tab) => {
    setChatOpen(false);
    setActiveTab(tab);
  };

  if (chatOpen && chatApp.selectedUser) {
    return (
      <AppShell>
        <MessageScreen
          currentUser={chatApp.currentUser}
          error={chatApp.error}
          historyLoading={chatApp.historyLoading}
          keyboardHeight={chatApp.keyboardHeight}
          message={chatApp.message}
          messages={chatApp.conversationMessages}
          online={chatApp.onlineUserIds.has(chatApp.selectedUser.user_id)}
          onBack={() => setChatOpen(false)}
          selectedUser={chatApp.selectedUser}
          sendMessage={chatApp.sendMessage}
          setMessage={chatApp.setMessage}
        />
      </AppShell>
    );
  }

  let screen = null;
  if (activeTab === "discover") {
    screen = (
      <DiscoverScreen
        acceptFriendRequest={chatApp.acceptFriendRequest}
        discoverableUsers={chatApp.discoverableUsers}
        friendActionKey={chatApp.friendActionKey}
        searchUsers={chatApp.searchUsers}
        searchingUsers={chatApp.searchingUsers}
        sendFriendRequest={chatApp.sendFriendRequest}
        userSearchResults={chatApp.userSearchResults}
      />
    );
  } else if (activeTab === "friends") {
    screen = (
      <FriendsScreen
        acceptFriendRequest={chatApp.acceptFriendRequest}
        friendActionKey={chatApp.friendActionKey}
        friends={chatApp.availableUsers}
        incomingRequests={chatApp.incomingRequests}
        onOpenChat={openChat}
        outgoingRequests={chatApp.outgoingRequests}
      />
    );
  } else if (activeTab === "profile") {
    screen = (
      <ProfileScreen
        connectionStatus={chatApp.connectionStatus}
        currentUser={chatApp.currentUser}
        logout={chatApp.logout}
      />
    );
  } else {
    screen = (
      <ChatsScreen
        currentUser={chatApp.currentUser}
        friends={chatApp.availableUsers}
        messages={chatApp.messages}
        onOpenChat={openChat}
        onRefresh={() => chatApp.loadUsers()}
        onlineUserIds={chatApp.onlineUserIds}
        refreshing={chatApp.refreshingUsers}
        unreadCounts={chatApp.unreadCounts}
      />
    );
  }

  return (
    <AppShell footer={<BottomTabs activeTab={activeTab} onChangeTab={changeTab} />}>
      {screen}
    </AppShell>
  );
}
