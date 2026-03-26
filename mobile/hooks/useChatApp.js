import { useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, Platform } from "react-native";

import chatSocket, {
  getDefaultBackendHost,
  getHttpBaseUrl,
  isProductionApiConfigured,
  normalizeBackendHost,
  setBackendHostOverride,
} from "../services/socket";
import { COMPOSER_DOCK_HEIGHT } from "../constants/theme";
import { pickProfileImageFromLibrary } from "../services/imagePicker";

export default function useChatApp() {
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [backendHost, setBackendHost] = useState(getDefaultBackendHost());
  const [message, setMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [sessionToken, setSessionToken] = useState("");
  const [availableUsers, setAvailableUsers] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [discoverableUsers, setDiscoverableUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [error, setError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [refreshingUsers, setRefreshingUsers] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isPickingAvatar, setIsPickingAvatar] = useState(false);
  const [friendActionKey, setFriendActionKey] = useState("");
  const currentUserIdRef = useRef(null);
  const selectedUserIdRef = useRef(null);

  const selectedUser = useMemo(
    () => availableUsers.find((user) => user.user_id === selectedUserId) || null,
    [availableUsers, selectedUserId],
  );
  const normalizedBackendHost = useMemo(
    () => normalizeBackendHost(backendHost),
    [backendHost],
  );
  const productionApiConfigured = isProductionApiConfigured();
  const resolvedBackendHost = normalizedBackendHost || getDefaultBackendHost();
  const httpBaseUrl = useMemo(
    () =>
      productionApiConfigured
        ? getHttpBaseUrl()
        : `http://${resolvedBackendHost}:8000`,
    [resolvedBackendHost, productionApiConfigured],
  );

  const conversationMessages = useMemo(() => {
    if (!currentUser || !selectedUserId) {
      return messages.filter(
        (item) => item.kind === "system" || item.kind === "error",
      );
    }

    return messages.filter((item) => {
      if (item.kind === "system" || item.kind === "error") {
        return true;
      }

      return (
        (item.senderId === currentUser.user_id &&
          item.receiverId === selectedUserId) ||
        (item.senderId === selectedUserId &&
          item.receiverId === currentUser.user_id)
      );
    });
  }, [currentUser, messages, selectedUserId]);

  useEffect(() => {
    if (productionApiConfigured) {
      return;
    }
    setBackendHostOverride(resolvedBackendHost);
  }, [resolvedBackendHost, productionApiConfigured]);

  useEffect(() => {
    currentUserIdRef.current = currentUser?.user_id ?? null;
  }, [currentUser?.user_id]);

  useEffect(() => {
    selectedUserIdRef.current = selectedUserId;
  }, [selectedUserId]);

  useEffect(() => {
    const unsubscribeMessages = chatSocket.onMessage((incomingMessage) => {
      const normalizedMessage = {
        id: incomingMessage.id || `${Date.now()}-${Math.random()}`,
        kind: incomingMessage.type || "incoming",
        senderId: incomingMessage.sender_id || null,
        receiverId: incomingMessage.receiver_id || null,
        text: incomingMessage.message,
        createdAt: incomingMessage.created_at || new Date().toISOString(),
      };

      setMessages((currentMessages) => {
        if (
          incomingMessage.id &&
          currentMessages.some((item) => item.id === incomingMessage.id)
        ) {
          return currentMessages;
        }

        return [...currentMessages, normalizedMessage];
      });

      if (
        normalizedMessage.senderId &&
        normalizedMessage.senderId !== selectedUserIdRef.current &&
        normalizedMessage.senderId !== currentUserIdRef.current
      ) {
        setUnreadCounts((currentCounts) => ({
          ...currentCounts,
          [normalizedMessage.senderId]:
            (currentCounts[normalizedMessage.senderId] || 0) + 1,
        }));
      }
    });

    const unsubscribeStatus = chatSocket.onStatusChange((nextStatus) => {
      setConnectionStatus(nextStatus);
    });

    return () => {
      unsubscribeMessages();
      unsubscribeStatus();
      chatSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const handleKeyboardShow = (event) => {
      setKeyboardHeight(event.endCoordinates?.height || 0);
    };

    const handleKeyboardHide = () => {
      setKeyboardHeight(0);
    };

    const showSubscription = Keyboard.addListener(showEvent, handleKeyboardShow);
    const hideSubscription = Keyboard.addListener(hideEvent, handleKeyboardHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const authorizedFetch = async (path, options = {}) => {
    if (!sessionToken) {
      throw new Error("Your session expired. Please log in again.");
    }

    const response = await fetch(`${httpBaseUrl}${path}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${sessionToken}`,
      },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.detail || "Request failed.");
    }

    return data;
  };

  const mergeHistory = (history) => {
    setMessages((currentMessages) => {
      const preservedNonConversation = currentMessages.filter(
        (item) => item.kind === "system" || item.kind === "error",
      );
      const normalizedHistory = history.map((item) => ({
        id: item.id || `${item.sender_id}-${item.receiver_id}-${item.created_at}`,
        kind: item.sender_id === currentUser?.user_id ? "outgoing" : "incoming",
        senderId: item.sender_id,
        receiverId: item.receiver_id,
        text: item.message,
        createdAt: item.created_at,
      }));

      const merged = [...preservedNonConversation];
      normalizedHistory.forEach((item) => {
        if (!merged.some((existing) => existing.id === item.id)) {
          merged.push(item);
        }
      });

      currentMessages.forEach((item) => {
        if (!merged.some((existing) => existing.id === item.id)) {
          merged.push(item);
        }
      });

      return merged;
    });
  };

  const loadUsers = async (tokenOverride = sessionToken) => {
    if (!tokenOverride) {
      return;
    }

    setRefreshingUsers(true);
    try {
      const response = await fetch(`${httpBaseUrl}/chat/contacts`, {
        headers: {
          Authorization: `Bearer ${tokenOverride}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Unable to load users.");
      }

      setAvailableUsers(data.friends || []);
      setIncomingRequests(data.incoming_requests || []);
      setOutgoingRequests(data.outgoing_requests || []);
      setDiscoverableUsers(data.discoverable_users || []);
      setSelectedUserId((currentSelectedUserId) => {
        if (
          currentSelectedUserId &&
          (data.friends || []).some((user) => user.user_id === currentSelectedUserId)
        ) {
          return currentSelectedUserId;
        }
        return data.friends?.[0]?.user_id ?? null;
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setRefreshingUsers(false);
    }
  };

  const loadConversation = async (peerId) => {
    if (!peerId || !sessionToken) {
      return;
    }

    setHistoryLoading(true);
    setError("");
    try {
      const history = await authorizedFetch(`/chat/messages?peer_id=${peerId}`);
      mergeHistory(history);
      setUnreadCounts((currentCounts) => ({
        ...currentCounts,
        [peerId]: 0,
      }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUserId) {
      loadConversation(selectedUserId);
    }
  }, [selectedUserId]);

  const sendFriendRequest = async (receiverId) => {
    try {
      setFriendActionKey(`send-${receiverId}`);
      setError("");
      await authorizedFetch("/chat/friend-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiver_id: receiverId,
        }),
      });
      await loadUsers();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setFriendActionKey("");
    }
  };

  const acceptFriendRequest = async (requestId, userId) => {
    try {
      setFriendActionKey(`accept-${requestId}`);
      setError("");
      await authorizedFetch(`/chat/friend-requests/${requestId}/accept`, {
        method: "POST",
      });
      await loadUsers();
      setSelectedUserId(userId);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setFriendActionKey("");
    }
  };

  const handleAuth = async () => {
    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }
    if (!password.trim()) {
      setError("Enter your password.");
      return;
    }
    if (authMode === "signup" && !username.trim()) {
      setError("Choose a username.");
      return;
    }

    try {
      setAuthLoading(true);
      setError("");
      const endpoint = authMode === "signup" ? "/auth/signup" : "/auth/login";
      const response = await fetch(`${httpBaseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          authMode === "signup"
            ? {
                email,
                username,
                password,
                avatar_url: avatarUrl || null,
              }
            : {
                email,
                password,
              },
        ),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Unable to connect.");
      }

      setCurrentUser(data.user);
      setSessionToken(data.token);
      setMessages([]);
      setUnreadCounts({});
      await loadUsers(data.token);
      await chatSocket.connect(data.user.user_id, data.token);
    } catch (requestError) {
      setCurrentUser(null);
      setSessionToken("");
      setError(requestError.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const pickAvatar = async () => {
    try {
      setIsPickingAvatar(true);
      setError("");
      const pickedAvatarUrl = await pickProfileImageFromLibrary();
      if (pickedAvatarUrl) {
        setAvatarUrl(pickedAvatarUrl);
      }
    } catch (pickerError) {
      setError(pickerError.message || "Unable to pick a profile photo.");
    } finally {
      setIsPickingAvatar(false);
    }
  };

  const clearAvatar = () => {
    setAvatarUrl("");
  };

  const logout = async () => {
    try {
      if (sessionToken) {
        await fetch(`${httpBaseUrl}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        });
      }
    } finally {
      chatSocket.disconnect();
      setCurrentUser(null);
      setSessionToken("");
      setAvailableUsers([]);
      setIncomingRequests([]);
      setOutgoingRequests([]);
      setDiscoverableUsers([]);
      setSelectedUserId(null);
      setMessages([]);
      setUnreadCounts({});
      setConnectionStatus("disconnected");
      setError("");
      setFriendActionKey("");
    }
  };

  const sendMessage = () => {
    const trimmedMessage = message.trim();

    if (!currentUser) {
      setError("Log in before sending messages.");
      return;
    }

    if (!selectedUserId) {
      setError("Choose a contact first.");
      return;
    }

    if (!trimmedMessage) {
      setError("Type a message before sending.");
      return;
    }

    try {
      setError("");
      chatSocket.sendMessage(selectedUserId, trimmedMessage);
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `${Date.now()}-${Math.random()}`,
          kind: "outgoing",
          senderId: currentUser.user_id,
          receiverId: selectedUserId,
          text: trimmedMessage,
          createdAt: new Date().toISOString(),
        },
      ]);
      setMessage("");
    } catch (socketError) {
      setError(socketError.message);
    }
  };

  return {
    authMode,
    setAuthMode,
    email,
    setEmail,
    username,
    setUsername,
    password,
    setPassword,
    avatarUrl,
    setAvatarUrl,
    backendHost,
    setBackendHost,
    resolvedBackendHost,
    productionApiConfigured,
    message,
    setMessage,
    currentUser,
    sessionToken,
    availableUsers,
    incomingRequests,
    outgoingRequests,
    discoverableUsers,
    selectedUserId,
    setSelectedUserId,
    selectedUser,
    conversationMessages,
    connectionStatus,
    error,
    authLoading,
    historyLoading,
    refreshingUsers,
    unreadCounts,
    keyboardHeight,
    isPickingAvatar,
    friendActionKey,
    composerDockHeight: COMPOSER_DOCK_HEIGHT,
    handleAuth,
    pickAvatar,
    clearAvatar,
    logout,
    loadUsers,
    sendFriendRequest,
    acceptFriendRequest,
    sendMessage,
  };
}
