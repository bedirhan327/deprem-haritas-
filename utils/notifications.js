import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Push bildirim izni isteyip token döner
export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    alert("Fiziksel cihaz gerekli (emülatörde çalışmaz)");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    alert("Bildirim izni verilmedi!");
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: "24dedaa9-a22d-4830-9884-73b167a7327b", // senin Expo project ID burada olmalı
  });

  const token = tokenData.data;

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  return token;
}
