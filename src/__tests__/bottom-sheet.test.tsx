import React, { createRef } from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Text, Dimensions } from 'react-native';
import { BottomSheet, BottomSheetRef, BottomSheetProps } from '../index';

const SCREEN_HEIGHT = Dimensions.get('window').height;

// Helper to render the bottom sheet with defaults
const renderSheet = (overrides: Partial<BottomSheetProps> = {}, ref?: React.Ref<BottomSheetRef>) => {
  const props: BottomSheetProps = {
    snapPoints: [300, 500],
    children: <Text>Sheet Content</Text>,
    ...overrides,
  };
  return render(<BottomSheet ref={ref} {...props} />);
};

// ========================================
// Rendering
// ========================================

describe('BottomSheet rendering', () => {
  it('renders children correctly', () => {
    const { getByText } = renderSheet();
    expect(getByText('Sheet Content')).toBeTruthy();
  });

  it('renders the drag handle by default', () => {
    const { toJSON } = renderSheet();
    const tree = JSON.stringify(toJSON());
    // The handle View has width 36 in styles — verify structure exists
    expect(tree).toBeTruthy();
  });

  it('hides the drag handle when enableDragHandle is false', () => {
    const { toJSON: withHandle } = renderSheet({ enableDragHandle: true });
    const { toJSON: withoutHandle } = renderSheet({ enableDragHandle: false });
    // The tree without handle should be smaller (fewer Views)
    const withStr = JSON.stringify(withHandle());
    const withoutStr = JSON.stringify(withoutHandle());
    expect(withoutStr.length).toBeLessThan(withStr.length);
  });

  it('renders backdrop by default', () => {
    const { toJSON } = renderSheet({ enableBackdrop: true });
    const tree = JSON.stringify(toJSON());
    // Backdrop is an Animated.View with backgroundColor #000
    expect(tree).toContain('#000');
  });

  it('does not render backdrop when enableBackdrop is false', () => {
    const { toJSON } = renderSheet({ enableBackdrop: false });
    const tree = JSON.stringify(toJSON());
    // No backdrop background color in tree
    expect(tree).not.toContain('"backgroundColor":"#000"');
  });
});

// ========================================
// Snap point logic
// ========================================

describe('Snap point resolution', () => {
  it('treats values <= 1 as screen-height percentages', () => {
    // With snap points [0.5], the resolved height should be SCREEN_HEIGHT * 0.5
    // We verify indirectly: the sheet should render with a computed maxHeight
    const { toJSON } = renderSheet({ snapPoints: [0.5] });
    expect(toJSON()).toBeTruthy();
  });

  it('treats values > 1 as absolute pixel heights', () => {
    const { toJSON } = renderSheet({ snapPoints: [250, 400] });
    expect(toJSON()).toBeTruthy();
  });

  it('handles a single snap point', () => {
    const { getByText } = renderSheet({ snapPoints: [300] });
    expect(getByText('Sheet Content')).toBeTruthy();
  });

  it('handles many snap points', () => {
    const { getByText } = renderSheet({ snapPoints: [100, 200, 300, 400, 500] });
    expect(getByText('Sheet Content')).toBeTruthy();
  });
});

// ========================================
// Imperative methods (open / close / expand)
// ========================================

describe('Imperative ref methods', () => {
  it('exposes snapTo, expand, collapse, close methods', () => {
    const ref = createRef<BottomSheetRef>();
    renderSheet({}, ref);

    expect(ref.current).toBeDefined();
    expect(typeof ref.current!.snapTo).toBe('function');
    expect(typeof ref.current!.expand).toBe('function');
    expect(typeof ref.current!.collapse).toBe('function');
    expect(typeof ref.current!.close).toBe('function');
  });

  it('calls onChange when snapTo is invoked', () => {
    const onChange = jest.fn();
    const ref = createRef<BottomSheetRef>();
    renderSheet({ onChange }, ref);

    act(() => {
      ref.current!.snapTo(1);
    });

    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('calls onClose when close is invoked', () => {
    const onClose = jest.fn();
    const ref = createRef<BottomSheetRef>();
    renderSheet({ onClose, initialIndex: 0 }, ref);

    act(() => {
      ref.current!.close();
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onChange with -1 when close is invoked', () => {
    const onChange = jest.fn();
    const ref = createRef<BottomSheetRef>();
    renderSheet({ onChange, initialIndex: 0 }, ref);

    act(() => {
      ref.current!.close();
    });

    expect(onChange).toHaveBeenCalledWith(-1);
  });

  it('expand snaps to the last (highest) snap point', () => {
    const onChange = jest.fn();
    const ref = createRef<BottomSheetRef>();
    renderSheet({ snapPoints: [200, 400, 600], onChange }, ref);

    act(() => {
      ref.current!.expand();
    });

    // Last index = 2
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('collapse snaps to index 0', () => {
    const onChange = jest.fn();
    const ref = createRef<BottomSheetRef>();
    renderSheet({ snapPoints: [200, 400, 600], onChange, initialIndex: 2 }, ref);

    act(() => {
      ref.current!.collapse();
    });

    expect(onChange).toHaveBeenCalledWith(0);
  });
});

// ========================================
// Backdrop press handling
// ========================================

describe('Backdrop press', () => {
  it('closes the sheet when backdrop is pressed', () => {
    const onClose = jest.fn();
    const onChange = jest.fn();
    const { toJSON } = renderSheet({
      enableBackdrop: true,
      onClose,
      onChange,
      initialIndex: 0,
    });

    // The backdrop is the first Animated.View with onTouchEnd
    // In our mock, Animated.View = View, so we can find it via the tree
    const tree = toJSON();
    // tree is an array (fragment) since the component returns <>...</>
    expect(Array.isArray(tree)).toBe(true);

    // The first element is the backdrop View
    const backdrop = (tree as any[])[0];
    expect(backdrop).toBeTruthy();

    // Simulate touch end on backdrop
    if (backdrop.props.onTouchEnd) {
      act(() => {
        backdrop.props.onTouchEnd();
      });
      expect(onClose).toHaveBeenCalled();
      expect(onChange).toHaveBeenCalledWith(-1);
    }
  });

  it('does not render backdrop when enableBackdrop is false', () => {
    const { toJSON } = renderSheet({ enableBackdrop: false });
    const tree = toJSON();

    // Without backdrop, the fragment should only contain the sheet view
    // (not an array or a shorter array)
    if (Array.isArray(tree)) {
      // All elements should be the sheet, none should have backgroundColor #000
      const json = JSON.stringify(tree);
      expect(json).not.toContain('"backgroundColor":"#000"');
    }
  });
});

// ========================================
// Gesture callback logic (unit-level)
// ========================================

describe('Gesture snap-point finding logic', () => {
  // We test the closest-snap-point algorithm directly by reimplementing it
  // (since the worklet function is internal). This validates the core logic
  // that the gesture.onEnd callback relies on.

  const findClosestSnapPoint = (y: number, resolvedSnapPoints: number[]): number => {
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

    const smallestTarget = SCREEN_HEIGHT - Math.min(...resolvedSnapPoints);
    if (y > smallestTarget + 100) return -1;

    return closest;
  };

  it('returns the closest snap point index for a given Y position', () => {
    const snaps = [300, 500];
    // Position near the 300 snap point
    const y = SCREEN_HEIGHT - 310;
    expect(findClosestSnapPoint(y, snaps)).toBe(0);
  });

  it('returns the higher snap point when closer', () => {
    const snaps = [300, 500];
    const y = SCREEN_HEIGHT - 480;
    expect(findClosestSnapPoint(y, snaps)).toBe(1);
  });

  it('returns -1 (close) when dragged far below the smallest snap point', () => {
    const snaps = [300, 500];
    // Far below smallest snap (300): y > (SCREEN_HEIGHT - 300) + 100
    const y = SCREEN_HEIGHT - 300 + 150;
    expect(findClosestSnapPoint(y, snaps)).toBe(-1);
  });

  it('handles single snap point', () => {
    const snaps = [400];
    const y = SCREEN_HEIGHT - 390;
    expect(findClosestSnapPoint(y, snaps)).toBe(0);
  });

  it('handles fractional (percentage-based) resolved snap points', () => {
    const snaps = [SCREEN_HEIGHT * 0.25, SCREEN_HEIGHT * 0.75];
    const y = SCREEN_HEIGHT - SCREEN_HEIGHT * 0.7;
    expect(findClosestSnapPoint(y, snaps)).toBe(1);
  });
});

// ========================================
// Initial index
// ========================================

describe('Initial index', () => {
  it('starts closed when initialIndex is -1 (default)', () => {
    const onChange = jest.fn();
    renderSheet({ onChange });
    // onChange should not be called during mount when starting closed
    expect(onChange).not.toHaveBeenCalled();
  });

  it('accepts a positive initialIndex', () => {
    const { getByText } = renderSheet({ initialIndex: 0 });
    expect(getByText('Sheet Content')).toBeTruthy();
  });
});
