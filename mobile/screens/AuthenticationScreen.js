import React from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import {
  ACCENT,
  BORDER,
  SURFACE,
  SURFACE_ELEVATED,
  SURFACE_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "../constants/theme";
import AvatarPicker from "../components/auth/AvatarPicker";

export default function AuthenticationScreen({
  authMode,
  setAuthMode,
  email,
  setEmail,
  username,
  setUsername,
  password,
  setPassword,
  avatarUrl,
  backendHost,
  setBackendHost,
  resolvedBackendHost,
  productionApiConfigured,
  error,
  authLoading,
  handleAuth,
  isPickingAvatar,
  pickAvatar,
  clearAvatar,
}) {
  const switchAuthMode = (nextMode) => (event) => {
    event?.preventDefault?.();
    setAuthMode(nextMode);
  };

  const submitAuth = (event) => {
    event?.preventDefault?.();
    handleAuth();
  };

  const authContent = (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        automaticallyAdjustKeyboardInsets
        bounces={false}
        contentContainerStyle={styles.authScrollContent}
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.authScroll}
      >
        <View style={styles.authHero}>
          <Text style={styles.authEyebrow}>Secure Messaging</Text>
          <Text style={styles.authTitle}>Chat App</Text>
          <Text style={styles.authSubtitle}>
            Sign up with email, pick a unique username, add an avatar, and jump into a cleaner messaging UI.
          </Text>
        </View>

        <View style={styles.authCard}>
          <View style={styles.authModeRow}>
            <Pressable
              accessibilityRole="button"
              onPress={switchAuthMode("login")}
              style={[
                styles.modePill,
                authMode === "login" ? styles.modePillActive : null,
              ]}
            >
              <Text
                style={[
                  styles.modePillText,
                  authMode === "login" ? styles.modePillTextActive : null,
                ]}
              >
                Login
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={switchAuthMode("signup")}
              style={[
                styles.modePill,
                authMode === "signup" ? styles.modePillActive : null,
              ]}
            >
              <Text
                style={[
                  styles.modePillText,
                  authMode === "signup" ? styles.modePillTextActive : null,
                ]}
              >
                Sign Up
              </Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            onSubmitEditing={Keyboard.dismiss}
            placeholder="you@example.com"
            placeholderTextColor={TEXT_SECONDARY}
            returnKeyType="done"
            style={styles.authInput}
            value={email}
          />

          {productionApiConfigured ? (
            <Text style={styles.helperText}>
              Production API configured. This build talks to the deployed backend automatically.
            </Text>
          ) : (
            <>
              <Text style={styles.label}>Backend Host</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "url"}
                onChangeText={setBackendHost}
                onSubmitEditing={Keyboard.dismiss}
                placeholder="192.168.1.25"
                placeholderTextColor={TEXT_SECONDARY}
                returnKeyType="done"
                style={styles.authInput}
                value={backendHost}
              />
              <Text style={styles.helperText}>
                Dev mode: enter your Mac's Wi-Fi IP here. Current target: {resolvedBackendHost}:8000
              </Text>
            </>
          )}

          {authMode === "signup" ? (
            <>
              <Text style={styles.label}>Username</Text>
              <TextInput
                autoCapitalize="none"
                onChangeText={setUsername}
                onSubmitEditing={Keyboard.dismiss}
                placeholder="unique_username"
                placeholderTextColor={TEXT_SECONDARY}
                returnKeyType="done"
                style={styles.authInput}
                value={username}
              />

              <AvatarPicker
                avatarUrl={avatarUrl}
                username={username}
                onPickAvatar={pickAvatar}
                onClearAvatar={clearAvatar}
                isPickingAvatar={isPickingAvatar}
              />
            </>
          ) : null}

          <Text style={styles.label}>Password</Text>
          <TextInput
            autoCapitalize="none"
            onChangeText={setPassword}
            onSubmitEditing={Keyboard.dismiss}
            placeholder="Enter your password"
            placeholderTextColor={TEXT_SECONDARY}
            returnKeyType="done"
            secureTextEntry
            style={styles.authInput}
            value={password}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            accessibilityRole="button"
            onPress={submitAuth}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>
              {authLoading
                ? "Please wait..."
                : authMode === "signup"
                  ? "Create Account"
                  : "Login"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  if (Platform.OS === "web") {
    return authContent;
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      {authContent}
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: SURFACE,
    flex: 1,
  },
  authScroll: {
    flex: 1,
  },
  authScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    paddingBottom: 48,
  },
  authHero: {
    gap: 10,
    marginBottom: 24,
  },
  authEyebrow: {
    color: ACCENT,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  authTitle: {
    color: TEXT_PRIMARY,
    fontSize: 38,
    fontWeight: "800",
  },
  authSubtitle: {
    color: TEXT_SECONDARY,
    fontSize: 16,
    lineHeight: 24,
  },
  authCard: {
    backgroundColor: SURFACE_ELEVATED,
    borderColor: BORDER,
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    padding: 20,
  },
  authModeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  modePill: {
    backgroundColor: SURFACE_MUTED,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  modePillActive: {
    backgroundColor: ACCENT,
  },
  modePillText: {
    color: TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: "700",
  },
  modePillTextActive: {
    color: "#08281f",
  },
  label: {
    color: TEXT_PRIMARY,
    fontSize: 14,
    fontWeight: "600",
  },
  authInput: {
    backgroundColor: SURFACE_MUTED,
    borderColor: BORDER,
    borderRadius: 14,
    borderWidth: 1,
    color: TEXT_PRIMARY,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: ACCENT,
    borderRadius: 14,
    marginTop: 8,
    paddingVertical: 15,
  },
  primaryButtonText: {
    color: "#08281f",
    fontSize: 16,
    fontWeight: "800",
  },
  helperText: {
    color: TEXT_SECONDARY,
    fontSize: 12,
    lineHeight: 18,
    marginTop: -4,
  },
  errorText: {
    color: "#ff9f9f",
    fontSize: 13,
  },
});
