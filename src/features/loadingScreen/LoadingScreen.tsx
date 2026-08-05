import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import { FlaskConical } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, router, useLocalSearchParams, RelativePathString } from 'expo-router';
const { height } = Dimensions.get('window');
const TUBE_HEIGHT = 80; 

type LoadingParams = {
  next: string
  title?: string
  subtitle?: string
}

type Props = {
  next?: string
  title?: string
  subtitle?: string
}


export default function LoadingScreen({ next, title, subtitle }: Props) {
  const fillAnimation = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const params = useLocalSearchParams<LoadingParams>();
  const [percentage, setPercentage] = useState('0%');
  
  
  const finalNext = next ?? (params.next as string) ?? "/home"
  const finalTitle = title ?? (params.title as string) ?? ""
  const finalSubtitle = subtitle ?? (params.subtitle as string) ?? ""
  
  const shouldNavigate = !!finalNext

  useEffect(() => {
    if(!shouldNavigate) return;

    const listenerId = fillAnimation.addListener(({ value }) => {
      setPercentage(`${Math.round(value * 100)}%`);
    });

    Animated.timing(fillAnimation, {
      toValue: 0.9,
      duration: 10000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(fillAnimation, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start();

      // Estabelece delay para navegação após a animação de preenchimento finalizar
      setTimeout(() => {
        router.replace(finalNext as RelativePathString)
      }, 2500)
    }, 3500)

    return () => clearTimeout(timer)
  }, [shouldNavigate]);

  const bgScaleY = fillAnimation;
  const bgTranslateY = fillAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [height / 2, 0], 
  });

  const tubeScaleY = fillAnimation;
  const tubeTranslateY = fillAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [TUBE_HEIGHT / 2, 0], 
  });

  return (
    <View className="flex-1 bg-[#16111b]">
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#16111b' }]} />

      {/* Gradiente vibrante restaurado */}
      <Animated.View 
        style={[
          StyleSheet.absoluteFillObject,
          { transform: [{ translateY: bgTranslateY }] }
        ]}
      >
        <LinearGradient
          colors={['#8A2BE2', 'black']} 
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </Animated.View>

      <View className="absolute inset-0 z-10 items-center justify-center">

        {/* --- PORCENTAGEM ACIMA --- */}
        <Text 
          className="text-7xl font-bold mb-3 tracking-wider text-[#eed9ff]/90 text-center"
          style={{ fontFamily: 'Manrope' }}
        >
          {percentage}
        </Text>
        
        <Text 
          className="text-center text-[2.2rem] font-bold tracking-[-0.02em] text-[#eed9ff]"
          style={{ fontFamily: 'Manrope'}}
        >
          {finalTitle}
        </Text>

        <Text 
          className="mt-4 text-base text-[#cfc2d7]"
          style={{ fontFamily: 'Manrope' }}
        >
          {finalSubtitle}
        </Text>

      </View>
    </View>
  );
}