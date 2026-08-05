import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, TouchableOpacity, View } from "react-native";
import * as Haptics from 'expo-haptics';


interface UploadButtonProps {
  onPress: () => void;
}

const UploadButton = ({ onPress }: UploadButtonProps) => {

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const glowAnim  = useRef(new Animated.Value(0)).current;  // ← adicione esta linha

  const handlePress = () => {
           Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.2,
        speed: 200,
        bounciness: 20,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        speed: 200,
        bounciness: 20,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };




  useEffect(() => {
  Animated.loop(
    Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
    ])
  ).start();
}, []);

const glowOpacity = glowAnim.interpolate({
  inputRange:  [0, 1],
  outputRange: [0.4, 1],
});


  return (
// DEPOIS — coloque isso:
<View
  style={{
    position: "absolute",
    right: 24,
    bottom: 112,
    width: 55,
    height: 55,
    alignItems: "center",
    justifyContent: "center",
  }}
>
  {/* ← adicione este Animated.View logo dentro do View */}
 {/* GLOW — oco, sombra parte da borda */}
<Animated.View
  pointerEvents="none"
  style={{
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 20,
    borderWidth: 12,              // ← espessura da borda que gera a sombra
    borderColor: "#8749f1",      // ← cor do glow
    backgroundColor: "transparent", // ← centro vazio, não tapa o blur
    opacity: glowOpacity,
    shadowColor: "#8749f1",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,            // ← tamanho do halo para fora
    elevation: 20,
  }}
/>

      {/* ── BOTÃO: totalmente isolado do glow ── */}
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={1}
        style={{ width: "100%", height: "100%" }}
      >
        <Animated.View
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 20,
            borderWidth: 1,
            borderColor: "#8749f1",
            overflow: "hidden",
            alignItems: "center",
            justifyContent: "center",
            transform: [{ scale: scaleAnim }],
          }}
        >
          {/* Blur base — efeito vítreo */}
          <BlurView
            intensity={30}
            tint="dark"
            style={{ position: "absolute", width: "100%", height: "100%" }}
          />

          {/* Gradiente diagonal por cima do blur */}
          <LinearGradient
            colors={["#8749f1","#150525" ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: "absolute", width: "100%", height: "100%", opacity: 0.4 }}
          />

          <Feather name="plus" size={26} color="white" />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

export default UploadButton;