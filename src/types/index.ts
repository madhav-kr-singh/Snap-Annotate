export type AnnotationType = 'stepNumber' | 'rectangle' | 'textBox' | 'blur';
export type ConnectorStyle = 'straight' | 'elbow' | 'curved';
export type BadgeStyle = 'circle' | 'square' | 'pill' | 'glow';
export type BoxStyle = 'solid' | 'dashed' | 'filled' | 'glow';

export type DragMode =
  | 'none'
  | 'moveItem'
  | 'moveTarget'
  | 'resizeTL'
  | 'resizeTR'
  | 'resizeBL'
  | 'resizeBR'
  | 'resizeTop'
  | 'resizeBottom'
  | 'resizeLeft'
  | 'resizeRight';

export interface Point {
  x: number;
  y: number;
}

export interface AnnotationItem {
  id: string;
  type: AnnotationType;
  position: Point; // Top-Left for box/text/blur; Center for step badge
  targetPoint?: Point | null; // For textBox callout lines (legacy)
  targetPoints?: Point[]; // Multiple arrow pointer targets for textBox callouts
  connectorStyle: ConnectorStyle;
  badgeStyle?: BadgeStyle; // Step badge shape
  boxStyle?: BoxStyle; // Highlight box style
  cornerRadius?: number; // Rectangle corner radius
  text: string;
  color: string; // Accent / badge fill / box border
  borderColor: string;
  backgroundColor: string;
  textColor: string;
  size: number; // Step badge diameter
  width: number;
  height: number;
  borderWidth: number;
  fontSize: number;
}

export interface ImageItem {
  id: string;
  name: string;
  dataUrl: string;
  width: number;
  height: number;
  imgElement: HTMLImageElement;
}

export interface AnnotationGroup {
  id: string;
  name: string;
  imageIds: string[]; // List of image IDs assigned to this group
  layout: 'vertical' | 'horizontal';
  borderColor: string;
  borderWidth: number;
  spacing: number;
}

export type ToolType = 'select' | 'stepNumber' | 'rectangle' | 'textBox' | 'blur';
