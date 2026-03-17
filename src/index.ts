import React, { useCallback, useImperativeHandle, forwardRef, useMemo } from 'react';
import { View, StyleSheet, Dimensions, BackHandler, Platform } from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// === Types ===

export interface BottomSheetProps {
  snapPoints: number[];
  initialIndex?: number;
  onClose?: () => void;
  onChange?: (index: number) => void;
  enableBackdrop?: boolean;
  backdropOpacity?: number;
  enableDragHandle?: boolean;
  enableBackHandler?: boolean;
  children: React.ReactNode;
}

export interface BottomSheetRef {
  snapTo: (index: number) => void;
  expand: () => void;
  collapse: () => void;
  close: () => void;
}

// === Component ===

export const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(
  (
    {
      snapPoints,
      initialIndex = -1,
      onClose,
      onChange,
      enableBackdrop = true,
      backdropOpacity = 0.5,
      enableDragHandle = true,
      enableBackHandler = true,
      children,
    },
    ref
  ) => {
    const resolvedSnapPoints = useMemo(
      () => snapPoints.map((p) => (p <= 1 ? SCREEN_HEIGHT * p : p)),
      [snapPoints]
    );

    const maxHeight = Math.max(...resolvedSnapPoints);
    const closedPosition = SCREEN_HEIGHT;
    const currentIndex = useSharedValue(initialIndex);
    const translateY = useSharedValue(
      initialIndex >= 0 ? SCREEN_HEIGHT - resolvedSnapPoints[initialIndex] : closedPosition
    );
    const context = useSharedValue(0);

    const snapTo = useCallback(
      (index: number) => {
        'worklet';
        if (index < 0) {
          translateY.value = withTiming(closedPosition, { duration: 250 });
          currentIndex.value = -1;
          if (onClose) runOnJS(onClose)();
        } else {
          const target = SCREEN_HEIGHT - resolvedSnapPoints[index];
          translateY.value = withSpring(target, { damping: 20, stiffness: 150 });
          currentIndex.value = index;
        }
        if (onChange) runOnJS(onChange)(index);
      },
      [resolvedSnapPoints, closedPosition, onClose, onChange]
    );

    const findClosestSnapPoint = useCallback(
      (y: number): number => {
        let closest = -1;
        let minDist = Infinity;

        for (let i = 0; i < resolvedSnapPoints.length; i++) {
          const target = SCREEN_HEIGHT - resolvedSnapPoints[i];
          const dist = Math.abs(y - target);
          if (dist < minDist) {
            minDist = dist;
            closest = i;
          }
        }

        // If too far below the smallest snap point, close
        const smallestTarget = SCREEN_HEIGHT - Math.min(...resolvedSnapPoints);
        if (y > smallestTarget + 100) return -1;

        return closest;
      },
      [resolvedSnapPoints]
    );

    const gesture = Gesture.Pan()
      .onStart(() => {
        context.value = translateY.value;
      })
      .onUpdate((event) => {
        const newY = context.value + event.translationY;
        const minY = SCREEN_HEIGHT - maxHeight;
        translateY.value = Math.max(newY, minY);
      })
      .onEnd((event) => {
        const velocity = event.velocityY;

        // Fast swipe down → close
        if (velocity > 1500) {
          snapTo(-1);
          return;
        }

        // Fast swipe up → expand to max
        if (velocity < -1500) {
          snapTo(resolvedSnapPoints.length - 1);
          return;
        }

        const closestIndex = findClosestSnapPoint(translateY.value);
        snapTo(closestIndex);
      });

    useImperativeHandle(ref, () => ({
      snapTo: (index: number) => snapTo(index),
      expand: () => snapTo(resolvedSnapPoints.length - 1),
      collapse: () => snapTo(0),
      close: () => snapTo(-1),
    }));

    // Back handler for Android
    React.useEffect(() => {
      if (!enableBackHandler || Platform.OS !== 'android') return;

      const handler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (currentIndex.value >= 0) {
          snapTo(-1);
          return true;
        }
        return false;
      });

      return () => handler.remove();
    }, [enableBackHandler, snapTo]);

    const sheetStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
    }));

    const backdropStyle = useAnimatedStyle(() => ({
      opacity: interpolate(
        translateY.value,
        [SCREEN_HEIGHT - maxHeight, closedPosition],
        [backdropOpacity, 0],
        Extrapolation.CLAMP
      ),
      pointerEvents: translateY.value >= closedPosition ? 'none' : 'auto',
    }));

    return (
      <>
        {enableBackdrop && (
          <Animated.View
            style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000' }, backdropStyle]}
            onTouchEnd={() => snapTo(-1)}
          />
        )}
        <GestureDetector gesture={gesture}>
          <Animated.View
            style={[
              styles.sheet,
              { height: maxHeight + 50 },
              sheetStyle,
            ]}
          >
            {enableDragHandle && (
              <View style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>
            )}
            {children}
          </Animated.View>
        </GestureDetector>
      </>
    );
  }
);

BottomSheet.displayName = 'BottomSheet';

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
  },
});

export default BottomSheet;
