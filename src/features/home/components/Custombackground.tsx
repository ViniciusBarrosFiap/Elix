import React from 'react';
import { StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { BottomSheetBackgroundProps } from '@gorhom/bottom-sheet';

const CustomBackground = ({ style, ...props }: BottomSheetBackgroundProps) => {
  return (
    <BlurView 
      intensity={80} 
      tint="dark" 
      style={[style, StyleSheet.absoluteFill, styles.blurContainer]} 
      {...props} 
    />
  );
};

const styles = StyleSheet.create({
  blurContainer: {
    overflow: 'hidden',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
});

export default CustomBackground;
