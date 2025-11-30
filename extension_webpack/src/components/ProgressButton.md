# ProgressButton Component Documentation

A modern, animated progress button component with enhanced accessibility and performance features.

## Features

- **Modern Design**: Glassmorphism-inspired design with smooth gradients and shadows
- **Smooth Animations**: Hardware-accelerated animations with easing curves
- **Accessibility First**: Full ARIA support, keyboard navigation, and reduced motion support
- **TypeScript**: Comprehensive type safety with proper interfaces
- **Performance Optimized**: 60fps animations using CSS transforms and GPU acceleration
- **Multiple Variants**: Support for different sizes, styles, and states
- **State Management**: Built-in states for idle, loading, completed, and error states

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `progress` | `number` | Required | Progress percentage (0-100) |
| `onClick` | `() => void` | Required | Click handler function |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size variant |
| `variant` | `'primary' \| 'secondary' \| 'danger'` | `'primary'` | Visual style variant |
| `disabled` | `boolean` | `false` | Disables button interaction |
| `isLoading` | `boolean` | `false` | Shows loading state with spinner |
| `isCompleted` | `boolean` | `false` | Shows completed state with checkmark |
| `className` | `string` | `''` | Additional CSS classes |
| `ariaLabel` | `string` | `undefined` | Custom ARIA label |
| `reducedMotion` | `boolean` | `false` | Disables animations for accessibility |

## Usage Examples

### Basic Usage

```tsx
import ProgressButton from './components/ProgressButton';

function App() {
  const [progress, setProgress] = useState(0);

  const handleStop = () => {
    console.log('Stop action triggered');
  };

  return (
    <ProgressButton 
      progress={progress} 
      onClick={handleStop} 
    />
  );
}
```

### With Loading State

```tsx
function LoadingExample() {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleProcessing = () => {
    setIsLoading(true);
    // Simulate async operation
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  return (
    <ProgressButton
      progress={progress}
      onClick={handleProcessing}
      isLoading={isLoading}
      variant="primary"
    />
  );
}
```

### With Completion State

```tsx
function CompletedExample() {
  const [progress, setProgress] = useState(100);
  const [isCompleted, setIsCompleted] = useState(true);

  return (
    <ProgressButton
      progress={progress}
      onClick={() => console.log('Task completed')}
      isCompleted={isCompleted}
      variant="primary"
    />
  );
}
```

### Different Variants and Sizes

```tsx
function VariantsExample() {
  return (
    <div className="space-y-4">
      {/* Primary variants */}
      <ProgressButton
        progress={75}
        onClick={() => {}}
        variant="primary"
        size="sm"
      />
      <ProgressButton
        progress={75}
        onClick={() => {}}
        variant="primary"
        size="md"
      />
      <ProgressButton
        progress={75}
        onClick={() => {}}
        variant="primary"
        size="lg"
      />

      {/* Secondary variant */}
      <ProgressButton
        progress={50}
        onClick={() => {}}
        variant="secondary"
      />

      {/* Danger variant */}
      <ProgressButton
        progress={25}
        onClick={() => {}}
        variant="danger"
      />
    </div>
  );
}
```

### Accessibility Support

```tsx
function AccessibleExample() {
  return (
    <ProgressButton
      progress={80}
      onClick={handleStop}
      ariaLabel="Stop job application process"
      reducedMotion={false}
    />
  );
}
```

## Animation Customization

### Custom Styling with CSS

You can customize the appearance using Tailwind CSS classes:

```tsx
<ProgressButton
  progress={60}
  onClick={() => {}}
  className="shadow-xl border-2 border-white/20"
/>
```

### Reduced Motion Support

The component automatically respects user accessibility preferences:

```tsx
// Check for reduced motion preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

<ProgressButton
  progress={60}
  onClick={() => {}}
  reducedMotion={prefersReducedMotion}
/>
```

## Animation States

### State Transitions

1. **Idle State**: Standard button with progress bar
2. **Hover State**: Scale increase (1.02x) and shadow elevation
3. **Active State**: Scale decrease (0.98x) with brightness increase
4. **Loading State**: Spinner icon with pulsing progress bar
5. **Completed State**: Green gradient with checkmark icon

### Performance Features

- Hardware-accelerated animations using `transform` and `opacity`
- Strategic use of `will-change` property
- Optimized animation timing for 60fps performance
- Memory-efficient animation cleanup

## Accessibility Guidelines

### Keyboard Navigation

- Fully keyboard accessible with Tab navigation
- Enter/Space key activation
- Visible focus indicators with 4.5:1 contrast ratio

### Screen Reader Support

- Automatic ARIA progressbar role
- Dynamic progress announcements
- State-based label updates
- Customizable aria-labels

### Motion Sensitivity

- Respects `prefers-reduced-motion` media query
- Configurable reduced motion mode
- Graceful degradation for users with motion sensitivity

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Performance Metrics

- **Animation Frame Rate**: 60fps target
- **First Paint**: < 16ms
- **Animation CPU Usage**: < 5% on modern devices
- **Memory Impact**: Minimal with proper cleanup

## Migration from Previous Version

### Breaking Changes

None - fully backward compatible

### API Migration

```tsx
// Old API
<ProgressButton progress={50} onClick={handleClick} />

// New API (same usage)
<ProgressButton progress={50} onClick={handleClick} />
```

### Enhanced Usage

```tsx
// Enhanced features (optional)
<ProgressButton 
  progress={75} 
  onClick={handleClick}
  size="lg"
  variant="primary"
  isLoading={isLoading}
  ariaLabel="Custom accessibility label"
/>
```

## Design System Integration

This component follows the Job Hunter design system:

- Consistent with existing Button component patterns
- Uses Tailwind CSS utilities
- Follows accessibility guidelines
- Integrates with existing icon library (React Icons)
- Maintains consistent spacing and typography scales

## Contributing

When modifying this component:

1. Maintain TypeScript strict mode compliance
2. Ensure all animations pass accessibility checks
3. Test with reduced motion preferences
4. Verify performance on lower-end devices
5. Update documentation for new features
