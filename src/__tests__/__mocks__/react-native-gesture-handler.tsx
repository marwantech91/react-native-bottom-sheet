// Mock for react-native-gesture-handler
// Replaces GestureDetector with a plain wrapper and stubs the Gesture API
// so the component tree renders without native gesture modules.

import React from 'react';
import { View } from 'react-native';

// GestureDetector just renders its children
export const GestureDetector = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

// Minimal chainable gesture mock
const createChainableGesture = () => {
  const chain: Record<string, Function> = {};
  const methods = ['onStart', 'onUpdate', 'onEnd', 'onFinalize', 'enabled', 'simultaneousWithExternalGesture'];
  methods.forEach((m) => {
    chain[m] = () => chain;
  });
  return chain;
};

export const Gesture = {
  Pan: () => createChainableGesture(),
  Tap: () => createChainableGesture(),
  Pinch: () => createChainableGesture(),
  Fling: () => createChainableGesture(),
};
