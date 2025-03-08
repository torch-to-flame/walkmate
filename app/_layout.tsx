import { Stack } from "expo-router";
import React from "react";
import HeaderBackButton from "../components/HeaderBackButton";
import { AuthProvider } from "../context/AuthContext";
import { FlashMessageProvider } from "../context/FlashMessageContext";
import { WalkProvider } from "../context/WalkContext";

export default function RootLayout() {
  return (
    <FlashMessageProvider>
      <AuthProvider>
        <WalkProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ title: "WalkMate" }} />
            <Stack.Screen name="signup" options={{ headerShown: false }} />
            <Stack.Screen name="signin" options={{ headerShown: false }} />
            <Stack.Screen
              name="(admin)"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="profile"
              options={{
                title: "Profile",
                headerShown: true,
                headerLeft: () => <HeaderBackButton />,
              }}
            />
            <Stack.Screen
              name="walk-details/[id]"
              options={{
                title: "Walk Details",
              }}
            />
            <Stack.Screen
              name="(tabs)"
              options={{
                headerShown: false,
              }}
            />
          </Stack>
        </WalkProvider>
      </AuthProvider>
    </FlashMessageProvider>
  );
}
