# React Native Bottom Sheet

![React Native](https://img.shields.io/badge/React_Native-0.72+-61DAFB?style=flat-square&logo=react)
![Reanimated](https://img.shields.io/badge/Reanimated-3.0+-5B37B7?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)

Gesture-driven bottom sheet with snap points, backdrop, and imperative API.

## Features

- Multiple snap points (absolute px or percentage)
- Smooth spring animations via Reanimated
- Swipe velocity detection (fast swipe to close/expand)
- Backdrop with animated opacity
- Android back button support
- Imperative ref API (`snapTo`, `expand`, `collapse`, `close`)

## Usage

```tsx
import { BottomSheet, BottomSheetRef } from '@marwantech/react-native-bottom-sheet';

function App() {
  const sheetRef = useRef<BottomSheetRef>(null);

  return (
    <>
      <Button title="Open" onPress={() => sheetRef.current?.snapTo(0)} />
      <BottomSheet
        ref={sheetRef}
        snapPoints={[0.3, 0.6, 0.9]}
        onClose={() => console.log('closed')}
      >
        <Text>Sheet Content</Text>
      </BottomSheet>
    </>
  );
}
```

## License

MIT
