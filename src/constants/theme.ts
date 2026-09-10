export const COLOR_PRESETS = [
  { name: 'Crimson Red', value: '#FF3B30' },
  { name: 'Indigo Accent', value: '#6366F1' },
  { name: 'Emerald Green', value: '#10B981' },
  { name: 'Amber Gold', value: '#F59E0B' },
  { name: 'Sky Blue', value: '#0EA5E9' },
  { name: 'Electric Purple', value: '#A855F7' },
  { name: 'Pure White', value: '#FFFFFF' },
  { name: 'Pure Dark', value: '#121212' },
  { name: 'Dark Slate', value: '#1E1E24' },
];

export const CONNECTOR_STYLES = [
  { id: 'straight', label: 'Straight', icon: 'Line' },
  { id: 'elbow', label: 'Elbow (Orthogonal)', icon: 'CornerDownRight' },
  { id: 'curved', label: 'Curved (Bézier)', icon: 'Spline' },
] as const;

export const DEFAULT_ANNOTATION_VALUES = {
  stepBadgeSize: 32,
  rectWidth: 140,
  rectHeight: 80,
  rectBorderWidth: 4,
  textBoxWidth: 160,
  textBoxHeight: 70,
  fontSize: 14,
  blurWidth: 120,
  blurHeight: 60,
};
