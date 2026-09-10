import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { drawAnnotationsOnCanvas } from '../utils/canvas';
import { AnnotationItem, DragMode, Point } from '../types';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  PanelLeftOpen,
  UploadCloud,
  FolderPlus,
  Upload
} from 'lucide-react';

interface CanvasWorkspaceProps {
  isLeftSidebarOpen?: boolean;
  onToggleLeftSidebar?: () => void;
}

export const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({
  isLeftSidebarOpen = true,
  onToggleLeftSidebar,
}) => {
  const {
    images,
    currentIndex,
    annotationsPerImage,
    selectedAnnotationId,
    activeTool,
    stepCounter,
    setStepCounter,
    addImage,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    setSelectedAnnotationId,
    setActiveTool,
    switchImage,
    undo,
    redo,
    pendingArrowTargetId,
    setPendingArrowTargetId,
  } = useAppStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgOverlayRef = useRef<SVGSVGElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDraggingOverCanvas, setIsDraggingOverCanvas] = useState(false);

  // File upload processor
  const processFiles = useCallback((files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          addImage(file.name, dataUrl, img.width, img.height, img);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  }, [addImage]);

  // Demo screenshot loader
  const handleSampleLoader = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 960;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 960, 600);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 960, 60);
    ctx.fillStyle = '#6366f1';
    ctx.beginPath();
    ctx.arc(40, 30, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('Analytics Pro Dashboard', 70, 35);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 60, 200, 540);
    ctx.fillStyle = '#334155';
    ctx.fillRect(20, 90, 160, 30);
    ctx.fillRect(20, 135, 160, 30);
    ctx.fillRect(20, 180, 160, 30);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(230, 90, 210, 120);
    ctx.fillRect(460, 90, 210, 120);
    ctx.fillRect(690, 90, 240, 120);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('$128,450', 250, 140);
    ctx.fillStyle = '#4ade80';
    ctx.fillText('+24.8%', 480, 140);
    ctx.fillStyle = '#c084fc';
    ctx.fillText('1,420 Active', 710, 140);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(230, 240, 700, 320);

    const dataUrl = canvas.toDataURL();
    const img = new Image();
    img.onload = () => {
      addImage('1_Sample_Dashboard.png', dataUrl, 960, 600, img);
    };
    img.src = dataUrl;
  };

  // Zoom & Pan state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });

  // Direct zero-latency drag refs
  const [dragMode, setDragMode] = useState<DragMode>('none');
  const dragStartMouseRef = useRef<Point>({ x: 0, y: 0 });
  const initialItemStateRef = useRef<AnnotationItem | null>(null);
  const transientItemRef = useRef<AnnotationItem | null>(null);
  const dragTargetIndexRef = useRef<number>(0);

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-focus textarea when editing starts
  useEffect(() => {
    if (editingId) {
      const timer = setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const len = textareaRef.current.value.length;
          textareaRef.current.setSelectionRange(len, len);
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [editingId]);

  // Live interactive arrow target rubberband cursor state
  const [liveTargetPos, setLiveTargetPos] = useState<Point | null>(null);

  useEffect(() => {
    if (!pendingArrowTargetId) {
      setLiveTargetPos(null);
    }
  }, [pendingArrowTargetId]);

  // React state for SVG handles overlay sync
  const [selectedItemState, setSelectedItemState] = useState<AnnotationItem | null>(null);

  const currentImg = currentIndex >= 0 ? images[currentIndex] : null;
  const currentAnnotations = currentIndex >= 0 ? annotationsPerImage[currentIndex] || [] : [];
  const selectedItemBase = currentAnnotations.find((item) => item.id === selectedAnnotationId) || null;
  const editingItem = currentAnnotations.find((item) => item.id === editingId) || null;

  // Sync selectedItemState with store when not dragging
  useEffect(() => {
    if (dragMode === 'none') {
      setSelectedItemState(selectedItemBase);
    }
  }, [selectedItemBase, dragMode]);

  // Zero-latency Direct Canvas Render
  const drawCanvasDirect = useCallback(
    (overrideItem?: AnnotationItem | null) => {
      const canvas = canvasRef.current;
      if (!canvas || !currentImg) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = currentImg.width;
      canvas.height = currentImg.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(currentImg.imgElement, 0, 0);

      const activeTransient = overrideItem !== undefined ? overrideItem : transientItemRef.current;

      const displayAnnotations = currentAnnotations.map((item) => {
        if (pendingArrowTargetId && item.id === pendingArrowTargetId && liveTargetPos) {
          const currentTargets = item.targetPoints && item.targetPoints.length > 0
            ? item.targetPoints
            : item.targetPoint
            ? [item.targetPoint]
            : [];
          return {
            ...item,
            targetPoints: [...currentTargets, liveTargetPos],
            targetPoint: currentTargets[0] || liveTargetPos,
          };
        }
        if (activeTransient && item.id === activeTransient.id) {
          return activeTransient;
        }
        return item;
      });

      drawAnnotationsOnCanvas(ctx, displayAnnotations, selectedAnnotationId);
    },
    [currentImg, currentAnnotations, selectedAnnotationId, pendingArrowTargetId, liveTargetPos]
  );

  useEffect(() => {
    drawCanvasDirect();
  }, [drawCanvasDirect]);

  // Fit image to workspace view
  const fitToWorkspace = useCallback(() => {
    if (!containerRef.current || !currentImg) return;
    const containerW = containerRef.current.clientWidth - 80;
    const containerH = containerRef.current.clientHeight - 80;

    const scaleW = containerW / currentImg.width;
    const scaleH = containerH / currentImg.height;
    const initialZoom = Math.min(1, Math.max(0.2, Math.min(scaleW, scaleH)));

    setZoom(initialZoom);
    setPan({ x: 0, y: 0 });
  }, [currentImg]);

  useEffect(() => {
    if (currentImg) {
      fitToWorkspace();
    }
  }, [currentImg, fitToWorkspace]);

  // Keyboard shortcuts & Arrow Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName) || editingId !== null) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === '[' || e.key === ']')) {
        e.preventDefault();
        onToggleLeftSidebar?.();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedAnnotationId) {
          e.preventDefault();
          deleteAnnotation(selectedAnnotationId);
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) {
          e.preventDefault();
          switchImage(currentIndex - 1);
        }
      } else if (e.key === 'ArrowRight') {
        if (currentIndex < images.length - 1) {
          e.preventDefault();
          switchImage(currentIndex + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, deleteAnnotation, selectedAnnotationId, editingId, currentIndex, images.length, switchImage, onToggleLeftSidebar]);

  // Convert client viewport coordinates to Canvas coordinates
  const getCanvasCoords = (e: React.MouseEvent | MouseEvent): Point => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // Helper to start dragging a new or existing item
  const startDragGesture = (e: React.MouseEvent, mode: DragMode, item: AnnotationItem) => {
    e.stopPropagation();
    setDragMode(mode);
    dragStartMouseRef.current = { x: e.clientX, y: e.clientY };
    const snapshot = JSON.parse(JSON.stringify(item));
    initialItemStateRef.current = snapshot;
    transientItemRef.current = snapshot;
    setSelectedItemState(snapshot);
  };

  // Double Click Handler to Trigger Inline Text Editing
  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    if (!currentImg) return;
    const { x, y } = getCanvasCoords(e);
    const hit = [...currentAnnotations].reverse().find((item) => {
      if (item.type === 'stepNumber') {
        const dx = x - item.position.x;
        const dy = y - item.position.y;
        return Math.sqrt(dx * dx + dy * dy) <= item.size / 2 + 6;
      } else {
        return (
          x >= item.position.x &&
          x <= item.position.x + item.width &&
          y >= item.position.y &&
          y <= item.position.y + item.height
        );
      }
    });

    if (hit && (hit.type === 'textBox' || hit.type === 'stepNumber')) {
      setSelectedAnnotationId(hit.id);
      setEditingId(hit.id);
    }
  };

  // Canvas Mouse Down Handler
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (!currentImg) return;

    if (e.button === 1 || e.altKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    const { x, y } = getCanvasCoords(e);

    // If active placement mode for arrow pointer target:
    if (pendingArrowTargetId) {
      const targetItem = currentAnnotations.find((item) => item.id === pendingArrowTargetId);
      if (targetItem) {
        const existingTargets = targetItem.targetPoints && targetItem.targetPoints.length > 0
          ? targetItem.targetPoints
          : targetItem.targetPoint
          ? [targetItem.targetPoint]
          : [];
        const nextTargets = [...existingTargets, { x: Math.round(x), y: Math.round(y) }];
        updateAnnotation(targetItem.id, {
          targetPoints: nextTargets,
          targetPoint: nextTargets[0],
        });
        setSelectedItemState((prev) =>
          prev && prev.id === targetItem.id
            ? { ...prev, targetPoints: nextTargets, targetPoint: nextTargets[0] }
            : prev
        );
      }
      setPendingArrowTargetId(null);
      return;
    }

    if (activeTool === 'stepNumber') {
      const newItem: AnnotationItem = {
        id: String(Date.now() + Math.random()),
        type: 'stepNumber',
        position: { x, y },
        connectorStyle: 'straight',
        text: String(stepCounter),
        color: '#FF3B30',
        borderColor: '#FFFFFF',
        backgroundColor: '#FF3B30',
        textColor: '#FFFFFF',
        size: 32,
        width: 32,
        height: 32,
        borderWidth: 2,
        fontSize: 14,
      };

      addAnnotation(newItem);
      setSelectedItemState(newItem);
      setStepCounter((c) => c + 1);
      setActiveTool('select');
    } else if (activeTool === 'rectangle') {
      // Interactive Click & Drag Creation for Highlight Box
      const newItem: AnnotationItem = {
        id: String(Date.now() + Math.random()),
        type: 'rectangle',
        position: { x, y },
        connectorStyle: 'straight',
        text: '',
        color: '#6366F1',
        borderColor: '#6366F1',
        backgroundColor: 'transparent',
        textColor: '#FFFFFF',
        size: 32,
        width: 40,
        height: 30,
        borderWidth: 4,
        fontSize: 14,
      };

      addAnnotation(newItem);
      startDragGesture(e, 'resizeBR', newItem);
    } else if (activeTool === 'textBox') {
      // Interactive Click & Drag Creation for Text Callout Box (Clean Text Box Only by Default)
      const newItem: AnnotationItem = {
        id: String(Date.now() + Math.random()),
        type: 'textBox',
        position: { x, y },
        targetPoint: null,
        targetPoints: [],
        connectorStyle: 'straight',
        text: '',
        color: '#6366F1',
        borderColor: '#6366F1',
        backgroundColor: '#1E1E24',
        textColor: '#FFFFFF',
        size: 32,
        width: 220,
        height: 90,
        borderWidth: 2,
        fontSize: 13,
      };

      addAnnotation(newItem);
      setSelectedAnnotationId(newItem.id);
      setSelectedItemState(newItem);
      setEditingId(newItem.id);
      setActiveTool('select');
    } else if (activeTool === 'blur') {
      // Interactive Click & Drag Creation for Pixel Blur Mask
      const newItem: AnnotationItem = {
        id: String(Date.now() + Math.random()),
        type: 'blur',
        position: { x, y },
        connectorStyle: 'straight',
        text: '',
        color: '#FFFFFF',
        borderColor: '#FFFFFF',
        backgroundColor: 'transparent',
        textColor: '#FFFFFF',
        size: 32,
        width: 40,
        height: 30,
        borderWidth: 2,
        fontSize: 14,
      };

      addAnnotation(newItem);
      startDragGesture(e, 'resizeBR', newItem);
    } else if (activeTool === 'select') {
      const hit = [...currentAnnotations].reverse().find((item) => {
        if (item.type === 'stepNumber') {
          const dx = x - item.position.x;
          const dy = y - item.position.y;
          return Math.sqrt(dx * dx + dy * dy) <= item.size / 2 + 6;
        } else {
          return (
            x >= item.position.x &&
            x <= item.position.x + item.width &&
            y >= item.position.y &&
            y <= item.position.y + item.height
          );
        }
      });

      if (hit) {
        setSelectedAnnotationId(hit.id);
        setSelectedItemState(hit);
        if (hit.type === 'textBox') {
          setEditingId(hit.id);
        }
        startDragGesture(e, 'moveItem', hit);
      } else {
        setSelectedAnnotationId(null);
        setSelectedItemState(null);
        setEditingId(null);
      }
    }
  };

  // 100% Direct GPU Mouse Move Listener
  useEffect(() => {
    let animId: number;

    const handleMouseMove = (e: MouseEvent) => {
      if (pendingArrowTargetId) {
        const coords = getCanvasCoords(e);
        setLiveTargetPos(coords);
        return;
      }

      if (isPanning) {
        setPan({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
        return;
      }

      if (dragMode === 'none' || !initialItemStateRef.current) return;

      const scale = zoom;
      const dx = (e.clientX - dragStartMouseRef.current.x) / scale;
      const dy = (e.clientY - dragStartMouseRef.current.y) / scale;

      const initX = initialItemStateRef.current.position.x;
      const initY = initialItemStateRef.current.position.y;
      const initW = initialItemStateRef.current.width;
      const initH = initialItemStateRef.current.height;

      let updated: AnnotationItem = { ...initialItemStateRef.current };

      if (dragMode === 'moveItem') {
        updated.position = { x: Math.round(initX + dx), y: Math.round(initY + dy) };
        const initTargets = initialItemStateRef.current.targetPoints && initialItemStateRef.current.targetPoints.length > 0
          ? initialItemStateRef.current.targetPoints
          : initialItemStateRef.current.targetPoint
          ? [initialItemStateRef.current.targetPoint]
          : [];

        if (initTargets.length > 0) {
          const shiftedTargets = initTargets.map((tp) => ({
            x: Math.round(tp.x + dx),
            y: Math.round(tp.y + dy),
          }));
          updated.targetPoints = shiftedTargets;
          updated.targetPoint = shiftedTargets[0];
        }
      } else if (dragMode === 'moveTarget') {
        const initTargets = initialItemStateRef.current.targetPoints && initialItemStateRef.current.targetPoints.length > 0
          ? initialItemStateRef.current.targetPoints
          : initialItemStateRef.current.targetPoint
          ? [initialItemStateRef.current.targetPoint]
          : [];

        const tIdx = dragTargetIndexRef.current;
        if (initTargets[tIdx]) {
          const updatedTargets = [...initTargets];
          updatedTargets[tIdx] = {
            x: Math.round(initTargets[tIdx].x + dx),
            y: Math.round(initTargets[tIdx].y + dy),
          };
          updated.targetPoints = updatedTargets;
          updated.targetPoint = updatedTargets[0];
        }
      } else if (dragMode === 'resizeBR') {
        updated.width = Math.max(30, Math.round(initW + dx));
        updated.height = Math.max(30, Math.round(initH + dy));
      } else if (dragMode === 'resizeTL') {
        const newW = Math.max(30, Math.round(initW - dx));
        const newH = Math.max(30, Math.round(initH - dy));
        updated.width = newW;
        updated.height = newH;
        updated.position = { x: initX + (initW - newW), y: initY + (initH - newH) };
      } else if (dragMode === 'resizeTR') {
        const newW = Math.max(30, Math.round(initW + dx));
        const newH = Math.max(30, Math.round(initH - dy));
        updated.width = newW;
        updated.height = newH;
        updated.position = { x: initX, y: initY + (initH - newH) };
      } else if (dragMode === 'resizeBL') {
        const newW = Math.max(30, Math.round(initW - dx));
        const newH = Math.max(30, Math.round(initH + dy));
        updated.width = newW;
        updated.height = newH;
        updated.position = { x: initX + (initW - newW), y: initY };
      } else if (dragMode === 'resizeRight') {
        updated.width = Math.max(30, Math.round(initW + dx));
      } else if (dragMode === 'resizeLeft') {
        const newW = Math.max(30, Math.round(initW - dx));
        updated.width = newW;
        updated.position = { x: initX + (initW - newW), y: initY };
      } else if (dragMode === 'resizeBottom') {
        updated.height = Math.max(30, Math.round(initH + dy));
      } else if (dragMode === 'resizeTop') {
        const newH = Math.max(30, Math.round(initH - dy));
        updated.height = newH;
        updated.position = { x: initX, y: initY + (initH - newH) };
      }

      transientItemRef.current = updated;
      setSelectedItemState(updated);

      if (animId) cancelAnimationFrame(animId);
      animId = requestAnimationFrame(() => {
        drawCanvasDirect(updated);
      });
    };

    const handleMouseUp = () => {
      setIsPanning(false);
      if (dragMode !== 'none' && transientItemRef.current && initialItemStateRef.current) {
        const final = transientItemRef.current;
        
        // If single quick click with minimal drag, ensure minimum readable bounds
        if (final.width <= 40 && final.height <= 35 && final.type === 'rectangle') {
          final.width = 140;
          final.height = 80;
        }

        updateAnnotation(final.id, {
          position: final.position,
          targetPoint: final.targetPoint,
          targetPoints: final.targetPoints,
          width: final.width,
          height: final.height,
        });

        setDragMode('none');
        initialItemStateRef.current = null;
        transientItemRef.current = null;

        // Auto-switch back to 'select' tool after drag creation finishes!
        setActiveTool('select');
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragMode, isPanning, panStart, zoom, updateAnnotation, drawCanvasDirect, setActiveTool, pendingArrowTargetId]);

  return (
    <main
      ref={containerRef}
      className="flex-1 bg-[#121212] canvas-grid-bg relative overflow-hidden flex items-center justify-center select-none"
    >
      {/* Floating Expand Sidebar Button when Left Sidebar is Hidden */}
      {!isLeftSidebarOpen && onToggleLeftSidebar && (
        <button
          onClick={onToggleLeftSidebar}
          className="absolute top-4 left-4 z-40 p-2.5 rounded-xl bg-[#181818]/90 hover:bg-indigo-600 border border-white/20 text-slate-300 hover:text-white shadow-2xl transition-all scale-100 hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer text-xs font-semibold backdrop-blur-md group"
          title="Show Left Sidebar (Ctrl+[)"
        >
          <PanelLeftOpen className="w-4 h-4 text-indigo-400 group-hover:text-white transition-colors" />
          <span>Show Sidebar</span>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => e.target.files && processFiles(e.target.files)}
        className="hidden"
      />

      {!currentImg ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDraggingOverCanvas(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDraggingOverCanvas(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDraggingOverCanvas(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              processFiles(e.dataTransfer.files);
            }
          }}
          className={`flex flex-col items-center justify-center p-6 text-center max-w-sm rounded-2xl border transition-all duration-200 z-30 ${
            isDraggingOverCanvas
              ? 'border-indigo-500 bg-indigo-500/15 scale-102 shadow-2xl shadow-indigo-500/20'
              : 'border-white/10 bg-[#161616]/90 hover:border-indigo-500/40 shadow-2xl backdrop-blur-md'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mb-3 border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
            <UploadCloud className="w-6 h-6 text-indigo-400 animate-pulse" />
          </div>
          
          <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-base text-white mb-1 tracking-tight">
            Upload Screenshots
          </h3>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-4 max-w-xs">
            Drag & drop files here, or browse from your device to start annotating and creating step guides.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 w-full">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/25 border border-indigo-400/30 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Browse Files</span>
            </button>

            <button
              onClick={handleSampleLoader}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sample Image</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          className="relative transition-transform duration-75"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          {/* Main Base Canvas */}
          <canvas
            ref={canvasRef}
            onMouseDown={handleCanvasMouseDown}
            onDoubleClick={handleCanvasDoubleClick}
            className="block shadow-2xl rounded-sm cursor-crosshair border border-white/10"
          />

          {/* SVG Handle Overlay Layer */}
          <svg
            ref={svgOverlayRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none z-20 overflow-visible"
            style={{ width: currentImg.width, height: currentImg.height }}
          >
            {selectedItemState && (
              <g className="pointer-events-auto">
                {selectedItemState.type === 'stepNumber' ? (
                  /* Step Badge Selection Ring */
                  <g onDoubleClick={() => setEditingId(selectedItemState.id)}>
                    <circle
                      cx={selectedItemState.position.x}
                      cy={selectedItemState.position.y}
                      r={selectedItemState.size / 2 + 5}
                      fill="none"
                      stroke="#6366F1"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx={selectedItemState.position.x}
                      cy={selectedItemState.position.y}
                      r={selectedItemState.size / 2}
                      fill="transparent"
                      className="cursor-move"
                      onMouseDown={(e) => startDragGesture(e, 'moveItem', selectedItemState)}
                    />
                    <g
                      transform={`translate(${selectedItemState.position.x + selectedItemState.size / 2 + 6}, ${
                        selectedItemState.position.y - selectedItemState.size / 2 - 6
                      })`}
                      className="cursor-pointer"
                      onClick={() => deleteAnnotation(selectedItemState.id)}
                    >
                      <circle r="10" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.5" />
                      <line x1="-4" y1="-4" x2="4" y2="4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                      <line x1="4" y1="-4" x2="-4" y2="4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                    </g>
                  </g>
                ) : (
                  /* Rect, Text Box, Blur Handles */
                  <g onDoubleClick={() => selectedItemState.type === 'textBox' && setEditingId(selectedItemState.id)}>

                    {/* Move handle in center */}
                    <rect
                      x={selectedItemState.position.x}
                      y={selectedItemState.position.y}
                      width={selectedItemState.width}
                      height={selectedItemState.height}
                      fill="transparent"
                      className="cursor-move"
                      onMouseDown={(e) => startDragGesture(e, 'moveItem', selectedItemState)}
                    />

                    {/* 8 Resize Handles (Corner & Edge) */}
                    {[
                      { mode: 'resizeTL', x: selectedItemState.position.x, y: selectedItemState.position.y, cursor: 'nwse-resize' },
                      { mode: 'resizeTR', x: selectedItemState.position.x + selectedItemState.width, y: selectedItemState.position.y, cursor: 'nesw-resize' },
                      { mode: 'resizeBL', x: selectedItemState.position.x, y: selectedItemState.position.y + selectedItemState.height, cursor: 'nesw-resize' },
                      { mode: 'resizeBR', x: selectedItemState.position.x + selectedItemState.width, y: selectedItemState.position.y + selectedItemState.height, cursor: 'nwse-resize' },
                      { mode: 'resizeTop', x: selectedItemState.position.x + selectedItemState.width / 2, y: selectedItemState.position.y, cursor: 'ns-resize' },
                      { mode: 'resizeBottom', x: selectedItemState.position.x + selectedItemState.width / 2, y: selectedItemState.position.y + selectedItemState.height, cursor: 'ns-resize' },
                      { mode: 'resizeLeft', x: selectedItemState.position.x, y: selectedItemState.position.y + selectedItemState.height / 2, cursor: 'ew-resize' },
                      { mode: 'resizeRight', x: selectedItemState.position.x + selectedItemState.width, y: selectedItemState.position.y + selectedItemState.height / 2, cursor: 'ew-resize' },
                    ].map((h, i) => (
                      <rect
                        key={i}
                        x={h.x - 6}
                        y={h.y - 6}
                        width="12"
                        height="12"
                        rx="3"
                        fill="#FFFFFF"
                        stroke="#6366F1"
                        strokeWidth="2"
                        style={{ cursor: h.cursor }}
                        onMouseDown={(e) => startDragGesture(e, h.mode as DragMode, selectedItemState)}
                      />
                    ))}

                    {/* Callout Target Handles for Multiple Arrows */}
                    {selectedItemState.type === 'textBox' &&
                      (selectedItemState.targetPoints && selectedItemState.targetPoints.length > 0
                        ? selectedItemState.targetPoints
                        : selectedItemState.targetPoint
                        ? [selectedItemState.targetPoint]
                        : []
                      ).map((tp, idx) => (
                        <g
                          key={idx}
                          className="cursor-pointer"
                          onMouseDown={(e) => {
                            dragTargetIndexRef.current = idx;
                            startDragGesture(e, 'moveTarget', selectedItemState);
                          }}
                        >
                          <circle
                            cx={tp.x}
                            cy={tp.y}
                            r="10"
                            fill="#6366F1"
                            stroke="#FFFFFF"
                            strokeWidth="2"
                          />
                          <text
                            x={tp.x}
                            y={tp.y + 3.5}
                            textAnchor="middle"
                            fill="#FFFFFF"
                            fontSize="9"
                            fontWeight="extrabold"
                            pointerEvents="none"
                            fontFamily="'Plus Jakarta Sans', sans-serif"
                          >
                            {idx + 1}
                          </text>
                        </g>
                      ))}

                    {/* Add Arrow handle button for Text Callout */}
                    {selectedItemState.type === 'textBox' && (
                      <g
                        transform={`translate(${selectedItemState.position.x + selectedItemState.width - 16}, ${
                          selectedItemState.position.y - 8
                        })`}
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingArrowTargetId(selectedItemState.id);
                        }}
                      >
                        <title>Add arrow pointer to this callout</title>
                        <circle r="10" fill="#6366F1" stroke="#FFFFFF" strokeWidth="1.5" />
                        <line x1="-4" y1="0" x2="4" y2="0" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                        <line x1="0" y1="-4" x2="0" y2="4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                      </g>
                    )}

                    {/* Delete handle top right */}
                    <g
                      transform={`translate(${selectedItemState.position.x + selectedItemState.width + 8}, ${
                        selectedItemState.position.y - 8
                      })`}
                      className="cursor-pointer"
                      onClick={() => deleteAnnotation(selectedItemState.id)}
                    >
                      <circle r="10" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.5" />
                      <line x1="-4" y1="-4" x2="4" y2="4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                      <line x1="4" y1="-4" x2="-4" y2="4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                    </g>
                  </g>
                )}
              </g>
            )}
          </svg>

          {/* Inline Text Overlay Editor for Text Callout */}
          {editingItem && editingItem.type === 'textBox' && (
            <textarea
              ref={textareaRef}
              value={editingItem.text}
              onChange={(e) => {
                const val = e.target.value;
                const el = e.target;
                let calcW = editingItem.width;
                let calcH = editingItem.height;

                if (el.scrollWidth > editingItem.width && editingItem.width < 450) {
                  calcW = Math.min(450, Math.max(editingItem.width, el.scrollWidth + 10));
                }
                if (el.scrollHeight > editingItem.height) {
                  calcH = Math.max(editingItem.height, el.scrollHeight);
                }

                updateAnnotation(editingItem.id, { text: val, width: calcW, height: calcH });
                setSelectedItemState((prev) => (prev ? { ...prev, text: val, width: calcW, height: calcH } : null));
              }}
              onBlur={() => setEditingId(null)}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Escape') {
                  setEditingId(null);
                }
              }}
              style={{
                position: 'absolute',
                left: `${editingItem.position.x}px`,
                top: `${editingItem.position.y}px`,
                width: `${editingItem.width}px`,
                height: `${editingItem.height}px`,
                fontSize: `${editingItem.fontSize || 13}px`,
                color: editingItem.textColor || '#FFFFFF',
                backgroundColor:
                  editingItem.backgroundColor === 'transparent'
                    ? 'rgba(19, 20, 31, 0.85)'
                    : editingItem.backgroundColor || '#1E1E24',
                borderColor: editingItem.borderColor || editingItem.color || '#6366F1',
                borderWidth: `${editingItem.borderWidth || 2}px`,
                borderStyle: 'solid',
                borderRadius: `${editingItem.cornerRadius || 8}px`,
                padding: '8px 10px',
                lineHeight: `${(editingItem.fontSize || 13) + 4}px`,
                outline: 'none',
                resize: 'none',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 0 2px rgba(99, 102, 241, 0.5)',
                zIndex: 50,
                fontFamily: "'Inter', sans-serif",
              }}
              placeholder="Type callout note..."
            />
          )}

          {/* Inline Text Overlay Editor for Step Badge */}
          {editingItem && editingItem.type === 'stepNumber' && (
            <input
              autoFocus
              ref={(el) => {
                if (el) {
                  el.focus();
                  el.select();
                }
              }}
              type="text"
              value={editingItem.text}
              onChange={(e) => {
                updateAnnotation(editingItem.id, { text: e.target.value });
                setSelectedItemState((prev) => (prev ? { ...prev, text: e.target.value } : null));
              }}
              onBlur={() => setEditingId(null)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter' || e.key === 'Escape') {
                  setEditingId(null);
                }
              }}
              style={{
                position: 'absolute',
                left: `${editingItem.position.x - editingItem.size / 2}px`,
                top: `${editingItem.position.y - editingItem.size / 2}px`,
                width: `${editingItem.size}px`,
                height: `${editingItem.size}px`,
                fontSize: `${Math.max(12, Math.round(editingItem.size * 0.48))}px`,
                color: editingItem.textColor || '#FFFFFF',
                backgroundColor: 'transparent',
                border: 'none',
                textAlign: 'center',
                outline: 'none',
                fontWeight: 'bold',
                zIndex: 50,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            />
          )}
        </div>
      )}

      {/* Floating Side Navigation Overlay Arrows (Forward & Backward) */}
      {currentImg && currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            switchImage(currentIndex - 1);
          }}
          className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#181818]/85 hover:bg-indigo-600 text-white border border-white/20 shadow-2xl flex items-center justify-center transition-all scale-100 hover:scale-110 active:scale-95 z-40 group cursor-pointer"
          title="Previous Screenshot (Left Arrow)"
        >
          <ChevronLeft className="w-7 h-7 group-hover:-translate-x-0.5 transition-transform text-slate-200 group-hover:text-white" />
        </button>
      )}

      {currentImg && currentIndex < images.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            switchImage(currentIndex + 1);
          }}
          className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#181818]/85 hover:bg-indigo-600 text-white border border-white/20 shadow-2xl flex items-center justify-center transition-all scale-100 hover:scale-110 active:scale-95 z-40 group cursor-pointer"
          title="Next Screenshot (Right Arrow)"
        >
          <ChevronRight className="w-7 h-7 group-hover:translate-x-0.5 transition-transform text-slate-200 group-hover:text-white" />
        </button>
      )}

      {/* Active Arrow Target Placement Banner */}
      {pendingArrowTargetId && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-indigo-600/95 text-white px-4 py-2 rounded-xl shadow-2xl z-50 flex items-center gap-3 border border-indigo-400/40 backdrop-blur-md animate-bounce">
          <span className="text-xs font-bold font-sans flex items-center gap-1.5">
            🎯 Click anywhere on the image to set where the Arrow Pointer should point
          </span>
          <button
            onClick={() => setPendingArrowTargetId(null)}
            className="px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-[11px] font-bold text-white transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Floating Canvas & Navigation Controls */}
      {currentImg && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#181818]/90 border border-white/10 rounded-xl px-3 py-1.5 backdrop-blur-md flex items-center gap-2 shadow-2xl z-30">
          {/* Image Navigation Switcher */}
          <div className="flex items-center gap-1 bg-white/5 rounded-lg px-1 py-0.5 border border-white/10">
            <button
              onClick={() => currentIndex > 0 && switchImage(currentIndex - 1)}
              disabled={currentIndex <= 0}
              className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:pointer-events-none transition-all"
              title="Previous Image (Left Arrow)"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold text-indigo-300 px-1 min-w-[50px] text-center">
              {currentIndex + 1} / {images.length}
            </span>
            <button
              onClick={() => currentIndex < images.length - 1 && switchImage(currentIndex + 1)}
              disabled={currentIndex >= images.length - 1}
              className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:pointer-events-none transition-all"
              title="Next Image (Right Arrow)"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-white/10 mx-0.5" />

          {/* Zoom controls */}
          <button
            onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold text-slate-200 min-w-[45px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-white/10 mx-1" />
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all"
            title="Reset 100%"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={fitToWorkspace}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all"
            title="Fit to Workspace"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </main>
  );
};
