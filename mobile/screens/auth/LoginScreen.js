import React from "react";
import {
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import AvatarPicker from "../../components/auth/AvatarPicker";
import AppButton from "../../components/ui/AppButton";
import { COLORS, RADIUS, SHADOW } from "../../constants/theme";

function AuthInput(props) {
  return (
    <TextInput
      autoCapitalize="none"
      onSubmitEditing={Keyboard.dismiss}
      placeholderTextColor={COLORS.muted}
      style={styles.input}
      {...props}
    />
  );
}

export default function LoginScreen({
  mode = "login",
  onSwitchMode,
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
  const isRegister = mode === "signup";

  return (
    <ScrollView
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={styles.content}
      keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      keyboardShouldPersistTaps="handled"
      style={styles.screen}
    >
      <View style={styles.hero}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>C</Text>
        </View>
        <Text style={styles.title}>{isRegister ? "Create account" : "Welcome back"}</Text>
        <Text style={styles.subtitle}>Fast. Private. Minimal.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <AuthInput
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="you@example.com"
          value={email}
        />

        {!productionApiConfigured ? (
          <>
            <Text style={styles.label}>Backend Host</Text>
            <AuthInput
              autoCorrect={false}
              keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "url"}
              onChangeText={setBackendHost}
              placeholder="192.168.1.25"
              value={backendHost}
            />
            <Text style={styles.helper}>Current target: {resolvedBackendHost}:8000</Text>
          </>
        ) : null}

        {isRegister ? (
          <>
            <Text style={styles.label}>Username</Text>
            <AuthInput
              onChangeText={setUsername}
              placeholder="unique_username"
              value={username}
            />
            <AvatarPicker
              avatarUrl={avatarUrl}
              clearAvatar={clearAvatar}
              isPickingAvatar={isPickingAvatar}
              onClearAvatar={clearAvatar}
              onPickAvatar={pickAvatar}
              pickAvatar={pickAvatar}
              username={username}
            />
          </>
        ) : null}

        <Text style={styles.label}>Password</Text>
        <AuthInput
          onChangeText={setPassword}
          placeholder="Enter your password"
          secureTextEntry
          value={password}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <AppButton
          disabled={authLoading}
          onPress={handleAuth}
          title={authLoading ? "Please wait..." : isRegister ? "Create Account" : "Login"}
        />

        <AppButton
          onPress={onSwitchMode}
          title={isRegister ? "I already have an account" : "Create account"}
          variant="ghost"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  hero: {
    marginBottom: 24,
  },
  logo: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 22,
    height: 58,
    justifyContent: "center",
    marginBottom: 18,
    width: 58,
    ...SHADOW,
  },
  logoText: {
    color: "#03110A",
    fontSize: 26,
    fontWeight: "900",
  },
  title: {
    color: COLORS.text,
    fontSize: 34,
    fontWeight: "900",
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 15,
    marginTop: 8,
  },
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    gap: 12,
    padding: 16,
    ...SHADOW,
  },
  label: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },
  input: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    color: COLORS.text,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  helper: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  error: {
    color: COLORS.danger,
    fontSize: 13,
    lineHeight: 18,
  },
});
