import LottieView from "lottie-react-native";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

const { width } = Dimensions.get("window");

interface WalkingCharactersProps {
  style?: object;
}

const TIME_TO_WALK_ACROSS_SCREEN = 15;

export default function WalkingCharacters({ style }: WalkingCharactersProps) {
  // Horizontal position animations
  const position = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create a sequence that moves characters across screen then resets position
    const walkAnimation = Animated.sequence([
      // Move across the screen
      Animated.timing(position, {
        toValue: 1,
        duration: TIME_TO_WALK_ACROSS_SCREEN * 1000,
        useNativeDriver: true,
      }),
      // Reset instantly (not visible due to being off-screen)
      Animated.timing(position, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
    ]);

    // Create looping animation
    const loopedAnimation = Animated.loop(walkAnimation);

    // Start the animation
    loopedAnimation.start();

    // Clean up animation when component unmounts
    return () => {
      loopedAnimation.stop();
    };
  }, []);

  // Calculate the actual X position based on the animated value
  const translateX = position.interpolate({
    inputRange: [0, 1],
    outputRange: [-150, width],
  });

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[styles.charactersGroup, { transform: [{ translateX }] }]}
      >
        {/* First character */}
        <View style={[styles.characterContainer, styles.firstCharacter]}>
          <LottieView
            style={styles.animation}
            source={require("../assets/animations/Animation - 1741393108088.lottie")}
            autoPlay
            loop
            speed={1.05}
          />
        </View>

        {/* Second character */}
        <View style={[styles.characterContainer, styles.secondCharacter]}>
          <LottieView
            style={styles.animation}
            source={require("../assets/animations/Animation - 1741393174208.lottie")}
            autoPlay
            loop
            speed={1.0}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    height: 100,
    overflow: "hidden",
    width: "100%",
  },
  charactersGroup: {
    position: "absolute",
    bottom: 0,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  characterContainer: {
    position: "relative",
  },
  firstCharacter: {
    zIndex: 2, // Put first character in front
    left: 10,
  },
  secondCharacter: {
    zIndex: 1, // Put second character behind
    left: -45, // More overlap
  },
  animation: {
    width: 100,
    height: 100,
  },
});
