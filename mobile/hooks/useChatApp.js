import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, Keyboard, Platform } from "react-native";

import chatSocket, {
  getDefaultBackendHost,
  getHttpBaseUrl,
  isProductionApiConfigured,
  normalizeBackendHost,
  setBackendHostOverride,
} from "../services/socket";
import { COMPOSER_DOCK_HEIGHT } from "../constants/theme";
import { pickProfileImageFromLibrary } from "../services/imagePicker";

const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/;

function formatApiError(data, fallbackMessage = "Request failed.") {
  const detail = data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        const location = Array.isArray(item?.loc)
          ? item.loc.filter((part) => part !== "body").join(".")
          : "";
        const message = item?.msg || fallbackMessage;
        return location ? `${location}: ${message}` : message;
      })
      .join("\n");
  }

  return fallbackMessage;
}

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
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
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
  const sessionTokenRef = useRef("");
  const refreshTimeoutRef = useRef(null);

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
    sessionTokenRef.current = sessionToken;
  }, [sessionToken]);

  useEffect(() => {
    const unsubscribeMessages = chatSocket.onMessage((incomingMessage) => {
      if (incomingMessage.type === "contacts_changed") {
        refreshAppData({ quiet: true });
        return;
      }

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

      refreshAppData({ quiet: true });
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
      throw new Error(formatApiError(data));
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
        kind: item.sender_id === currentUserIdRef.current ? "outgoing" : "incoming",
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

  const loadUsers = async (tokenOverride = sessionToken, options = {}) => {
    if (!tokenOverride) {
      return;
    }

    if (!options.quiet) {
      setRefreshingUsers(true);
    }
    try {
      const response = await fetch(`${httpBaseUrl}/chat/contacts`, {
        headers: {
          Authorization: `Bearer ${tokenOverride}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(formatApiError(data, "Unable to load users."));
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
      if (!options.quiet) {
        setRefreshingUsers(false);
      }
    }
  };

  const loadConversation = async (
    peerId,
    tokenOverride = sessionToken,
    options = {},
  ) => {
    if (!peerId || !tokenOverride) {
      return;
    }

    if (!options.quiet) {
      setHistoryLoading(true);
    }
    setError("");
    try {
      const response = await fetch(`${httpBaseUrl}/chat/messages?peer_id=${peerId}`, {
        headers: {
          Authorization: `Bearer ${tokenOverride}`,
        },
      });
      const history = await response.json().catch(() => []);
      if (!response.ok) {
        throw new Error(formatApiError(history, "Unable to load messages."));
      }
      mergeHistory(history);
      setUnreadCounts((currentCounts) => ({
        ...currentCounts,
        [peerId]: 0,
      }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      if (!options.quiet) {
        setHistoryLoading(false);
      }
    }
  };

  useEffect(() => {
    if (selectedUserId) {
      loadConversation(selectedUserId);
    }
  }, [selectedUserId]);

  const refreshAppData = useCallback((options = {}) => {
    if (!sessionTokenRef.current) {
      return;
    }

    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = setTimeout(() => {
      loadUsers(sessionTokenRef.current, options);
      if (selectedUserIdRef.current) {
        loadConversation(selectedUserIdRef.current, sessionTokenRef.current, {
          quiet: true,
        });
      }
    }, options.immediate ? 0 : 300);
  }, [httpBaseUrl]);

  useEffect(() => {
    if (!sessionToken) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      refreshAppData({ quiet: true });
    }, 10000);

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        refreshAppData({ quiet: true, immediate: true });
      }
    });

    return () => {
      clearInterval(intervalId);
      subscription.remove();
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [sessionToken, refreshAppData]);

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
      refreshAppData({ quiet: true, immediate: true });
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
      refreshAppData({ quiet: true, immediate: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setFriendActionKey("");
    }
  };

  const searchUsers = useCallback(async (query) => {
    const cleanedQuery = query.trim().toLowerCase();
    if (!cleanedQuery) {
      setUserSearchResults([]);
      return;
    }

    try {
      setSearchingUsers(true);
      setError("");
      const results = await authorizedFetch(
        `/chat/users/search?username=${encodeURIComponent(cleanedQuery)}`,
      );
      setUserSearchResults(results || []);
    } catch (requestError) {
      setUserSearchResults([]);
      setError(requestError.message);
    } finally {
      setSearchingUsers(false);
    }
  }, [sessionToken, httpBaseUrl]);

  const handleAuth = async () => {
    const cleanedEmail = email.trim().toLowerCase();
    const cleanedUsername = username.trim().toLowerCase();

    if (!cleanedEmail) {
      setError("Enter your email address.");
      return;
    }
    if (!password.trim()) {
      setError("Enter your password.");
      return;
    }
    if (authMode === "signup" && !cleanedUsername) {
      setError("Choose a username.");
      return;
    }
    if (authMode === "signup" && !USERNAME_PATTERN.test(cleanedUsername)) {
      setError("Username must be 3-24 chars using lowercase letters, numbers, or underscores.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
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
                email: cleanedEmail,
                username: cleanedUsername,
                password,
                avatar_url: avatarUrl || null,
              }
            : {
                email: cleanedEmail,
                password,
              },
        ),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(formatApiError(data, "Unable to connect."));
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
      setUserSearchResults([]);
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
    userSearchResults,
    searchingUsers,
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
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    sendMessage,
  };
}
