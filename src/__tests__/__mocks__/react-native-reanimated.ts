// Mock for react-native-reanimated
// Provides simplified implementations so component logic can be tested
// without native animation modules.

const useSharedValue = (initial: number) => ({ value: initial });

const useAnimatedStyle = (fn: () => any) => fn();

const withSpring = (toValue: number) => toValue;
const withTiming = (toValue: number) => toValue;

const runOnJS = (fn: Function) => fn;

const interpolate = (
  value: number,
  inputRange: number[],
  outputRange: number[],
  _extrapolation?: any
) => {
  const [inMin, inMax] = inputRange;
  const [outMin, outMax] = outputRange;
  const ratio = (value - inMin) / (inMax - inMin);
  const clamped = Math.max(0, Math.min(1, ratio));
  return outMin + clamped * (outMax - outMin);
};

const Extrapolation = { CLAMP: 'clamp' };

// Animated.View just renders a plain View
const Animated = {
  View: require('react-native').View,
};

export {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
};

export default Animated;
