import JSZip from 'jszip';
import { AnnotationGroup, ImageItem, AnnotationItem } from '../types';
import { renderMergedGuideCanvas } from './canvas';

/**
 * Downloads canvas content as a high-res PNG image file.
 */
export function downloadCanvasAsPNG(canvas: HTMLCanvasElement, filename: string) {
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Formats group name into clean zip filename (e.g. "Group 1" -> "1.png", "Group 2" -> "2.png").
 */
export function formatGroupZipFilename(group: AnnotationGroup, index: number): string {
  let name = group.name.trim();

  // Strip 'group' case-insensitively from group name
  name = name.replace(/^group\s*|\bgroup\b\s*/gi, '').trim();
  // Strip 'guide:' prefix if present
  name = name.replace(/^guide:\s*/gi, '').trim();

  if (!name) {
    const numMatch = group.id.match(/\d+/);
    name = numMatch ? numMatch[0] : String(index + 1);
  }

  // Clean illegal filename characters
  name = name.replace(/[/\\?%*:|"<>]/g, '_');

  return name.endsWith('.png') ? name : `${name}.png`;
}

/**
 * Renders all groups as vertically-stacked multi-image guides and exports them in a ZIP archive.
 * Removes "Group " prefix from filenames (e.g. Group 1 -> 1.png, Group 2 -> 2.png).
 */
export async function exportAllGroupsAsZip(
  groups: AnnotationGroup[],
  images: ImageItem[],
  annotationsPerImage: Record<number, AnnotationItem[]>
): Promise<void> {
  const zip = new JSZip();
  let count = 0;

  groups.forEach((group, groupIdx) => {
    const groupImages = group.imageIds
      .map((id) => images.find((img) => img.id === id))
      .filter((img): img is ImageItem => Boolean(img));
    if (groupImages.length === 0) return;

    const groupAnnotations: Record<number, AnnotationItem[]> = {};
    groupImages.forEach((img, idx) => {
      const originalIdx = images.findIndex((i) => i.id === img.id);
      groupAnnotations[idx] = annotationsPerImage[originalIdx] || [];
    });

    // Render composite vertically-stacked guide canvas for this group
    const mergedCanvas = renderMergedGuideCanvas(groupImages, groupAnnotations, group);

    const filename = formatGroupZipFilename(group, groupIdx);
    const dataUrl = mergedCanvas.toDataURL('image/png');
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');

    zip.file(filename, base64Data, { base64: true });
    count++;
  });

  if (count === 0) return;

  const content = await zip.generateAsync({ type: 'blob' });
  const blobUrl = URL.createObjectURL(content);

  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = 'annotated_guides.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 1000);
}
