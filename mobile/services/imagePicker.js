import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";

export async function pickProfileImageFromLibrary() {
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permissionResult.granted) {
    Alert.alert(
      "Photo Access Needed",
      "Allow photo library access to choose a profile picture.",
    );
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    aspect: [1, 1],
    base64: true,
    mediaTypes: ["images"],
    quality: 0.35,
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  const asset = result.assets[0];
  if (asset.base64) {
    return `data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}`;
  }

  return asset.uri;
}
