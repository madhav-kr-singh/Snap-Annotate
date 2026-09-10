import React, { useRef, useState } from 'react';
import { useAppStore, sortGroupsNumerically } from '../store/useAppStore';
import { renderMergedGuideCanvas } from '../utils/canvas';
import { downloadCanvasAsPNG, exportAllGroupsAsZip } from '../utils/export';
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  ArrowUp, 
  ArrowDown, 
  Sparkles,
  Plus,
  Layers,
  FolderPlus,
  GripVertical,
  Download,
  Trash2,
  Archive
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    images,
    currentIndex,
    annotationsPerImage,
    addImage,
    switchImage,
    removeImage,
    reorderImages,
    groups,
    activeGroupId,
    createGroup,
    deleteGroup,
    setActiveGroupId,
    assignImageToGroup,
    moveImageBetweenGroups,
    removeImageFromGroup,
    updateGroup,
    autoGroupImagesByName,
  } = useAppStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const draggedImageIdRef = useRef<string | null>(null);
  const draggedSourceGroupIdRef = useRef<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [draggedSourceGroupId, setDraggedSourceGroupId] = useState<string | null>(null);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);
  const [dragOverImageIndex, setDragOverImageIndex] = useState<number | null>(null);

  const processFiles = (files: FileList | File[]) => {
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
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleDragOverFile = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(true);
  };

  const handleDragLeaveFile = () => {
    setIsDraggingFile(false);
  };

  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Sample screenshots loader
  const createSampleScreenshot = (type: 'dashboard' | 'form') => {
    const canvas = document.createElement('canvas');
    canvas.width = 960;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (type === 'dashboard') {
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

      const cardColors = ['#38bdf8', '#818cf8', '#34d399', '#f472b6'];
      for (let i = 0; i < 4; i++) {
        const x = 220 + (i % 2) * 360;
        const y = 80 + Math.floor(i / 2) * 240;

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(x, y, 340, 210, 12);
        ctx.fill();

        ctx.fillStyle = cardColors[i];
        ctx.fillRect(x + 20, y + 20, 40, 6);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px sans-serif';
        ctx.fillText(`Metric Group #${i + 1}`, x + 20, y + 55);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText(`$${(12400 * (i + 1)).toLocaleString()}`, x + 20, y + 95);

        ctx.fillStyle = cardColors[i];
        for (let b = 0; b < 10; b++) {
          const barH = 20 + Math.random() * 60;
          ctx.fillRect(x + 20 + b * 28, y + 190 - barH, 18, barH);
        }
      }
    } else {
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, 960, 600);

      ctx.fillStyle = '#1f2937';
      ctx.beginPath();
      ctx.roundRect(180, 50, 600, 500, 16);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('Account Settings & Security', 220, 100);

      const labels = ['Full Name', 'Work Email Address', 'API Key Secret', 'Notification Preference'];
      labels.forEach((label, idx) => {
        const y = 140 + idx * 90;
        ctx.fillStyle = '#9ca3af';
        ctx.font = '14px sans-serif';
        ctx.fillText(label, 220, y);

        ctx.fillStyle = '#374151';
        ctx.beginPath();
        ctx.roundRect(220, y + 10, 520, 44, 8);
        ctx.fill();

        ctx.fillStyle = '#e5e7eb';
        ctx.font = '14px sans-serif';
        const val = idx === 2 ? 'sk_live_9948102948192038102384' : `Sample Value for ${label}`;
        ctx.fillText(val, 240, y + 36);
      });
    }

    const dataUrl = canvas.toDataURL('image/png');
    const img = new Image();
    const sampleName = type === 'dashboard' ? `1_${images.length + 1}_dashboard.png` : `2_${images.length + 1}_form_settings.png`;
    img.onload = () => {
      addImage(sampleName, dataUrl, canvas.width, canvas.height, img);
    };
    img.src = dataUrl;
  };

  // Export group PNG
  const handleExportGroup = (group: typeof groups[0]) => {
    const groupImages = images.filter((img) => group.imageIds.includes(img.id));
    if (groupImages.length === 0) return;

    const groupAnnotations: Record<number, any> = {};
    groupImages.forEach((img, idx) => {
      const originalIdx = images.findIndex((i) => i.id === img.id);
      groupAnnotations[idx] = annotationsPerImage[originalIdx] || [];
    });

    const mergedCanvas = renderMergedGuideCanvas(groupImages, groupAnnotations, group);
    downloadCanvasAsPNG(mergedCanvas, `${group.name.replace(/\s+/g, '_')}_guide`);
  };

  const [isZipping, setIsZipping] = useState(false);

  const handleExportZip = async () => {
    if (images.length === 0 || isZipping) return;
    try {
      setIsZipping(true);
      await exportAllGroupsAsZip(groups, images, annotationsPerImage);
    } catch (err) {
      console.error('ZIP Export Error:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <aside className="w-80 bg-[#121212] border-r border-white/10 flex flex-col h-full shrink-0 select-none">
      {/* Upload Zone & Samples */}
      <div className="p-3 border-b border-white/10 space-y-2">
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOverFile}
          onDragLeave={handleDragLeaveFile}
          onDrop={handleDropFile}
          className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all ${
            isDraggingFile
              ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02]'
              : 'border-white/15 bg-[#1e1e1e]/60 hover:border-indigo-500/50 hover:bg-[#1e1e1e]'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            multiple
            className="hidden"
          />
          <div className="flex items-center justify-center gap-2 text-indigo-400">
            <Upload className="w-4 h-4" />
            <span className="text-xs font-semibold text-slate-200">Drop Images or Click to Upload</span>
          </div>
        </div>

        <div className="flex gap-1.5">
          <button
            onClick={() => createSampleScreenshot('dashboard')}
            className="flex-1 py-1 px-2 rounded-lg text-[10px] font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all flex items-center justify-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            <span>+ Dashboard</span>
          </button>
          <button
            onClick={() => createSampleScreenshot('form')}
            className="flex-1 py-1 px-2 rounded-lg text-[10px] font-semibold text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-all flex items-center justify-center gap-1"
          >
            <Plus className="w-3 h-3" />
            <span>+ Form UI</span>
          </button>
        </div>
      </div>

      {/* Guide Groups Manager */}
      <div className="p-3 border-b border-white/10 bg-indigo-500/[0.02]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-xs uppercase tracking-wider text-slate-200">
              Groups ({groups.length})
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => autoGroupImagesByName()}
              className="px-2 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold flex items-center gap-1 transition-all"
              title="Auto-Group Screenshots by Filename Sequence"
            >
              <Sparkles className="w-3 h-3" />
              <span>Auto</span>
            </button>
            <button
              onClick={() => createGroup()}
              className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 transition-all"
              title="Create New Guide Group"
            >
              <FolderPlus className="w-3 h-3" />
              <span>+ Group</span>
            </button>
          </div>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {sortGroupsNumerically(groups, images).map((group) => {
            const isGroupActive = group.id === activeGroupId;
            const assignedCount = group.imageIds.length;
            const isTargetDrop = dragOverGroupId === group.id;
            const isAlreadyInGroup = draggedImageId ? group.imageIds.includes(draggedImageId) : false;

            return (
              <div
                key={group.id}
                onClick={() => setActiveGroupId(group.id)}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const imgId = draggedImageIdRef.current || draggedImageId || e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('imageId');
                  const alreadyIn = imgId ? group.imageIds.includes(imgId) : false;
                  if (alreadyIn) {
                    e.dataTransfer.dropEffect = 'none';
                  } else {
                    e.dataTransfer.dropEffect = 'move';
                  }
                  setDragOverGroupId(group.id);
                }}
                onDragLeave={() => {
                  setDragOverGroupId(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOverGroupId(null);
                  const imgId = draggedImageIdRef.current || e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('imageId') || draggedImageId;

                  if (imgId && !group.imageIds.includes(imgId)) {
                    assignImageToGroup(imgId, group.id);
                  }

                  draggedImageIdRef.current = null;
                  draggedSourceGroupIdRef.current = null;
                  setDraggedImageId(null);
                  setDraggedSourceGroupId(null);
                }}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isTargetDrop
                    ? isAlreadyInGroup
                      ? 'bg-rose-500/20 border-rose-500 scale-[1.02] shadow-xl shadow-rose-500/20'
                      : 'bg-indigo-500/20 border-indigo-400 scale-[1.02] shadow-xl shadow-indigo-500/20'
                    : isGroupActive
                    ? 'bg-indigo-500/10 border-indigo-500/50 shadow-md shadow-indigo-500/10'
                    : 'bg-[#1e1e1e]/60 border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <input
                    type="text"
                    value={group.name}
                    onChange={(e) => updateGroup(group.id, { name: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-transparent font-bold text-xs text-white focus:outline-none focus:border-b border-emerald-400 w-36 truncate"
                  />
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportGroup(group);
                      }}
                      disabled={assignedCount === 0}
                      className="p-1 rounded text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-30"
                      title="Export Group PNG"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                    {groups.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteGroup(group.id);
                        }}
                        className="p-1 rounded text-rose-400 hover:bg-rose-500/20"
                        title="Delete Group"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-white/5 pt-1.5 mt-1">
                  <span className="font-mono text-emerald-300">{assignedCount} Screenshots</span>
                  {isTargetDrop ? (
                    isAlreadyInGroup ? (
                      <span className="text-rose-400 font-bold flex items-center gap-1 animate-pulse">
                        <span className="w-3.5 h-3.5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[9px] font-black">🚫</span>
                        Already in this group
                      </span>
                    ) : (
                      <span className="text-emerald-300 font-bold flex items-center gap-1 animate-bounce">
                        <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-black">✓</span>
                        {draggedSourceGroupIdRef.current || draggedSourceGroupId ? 'Move image here' : 'Drop to add here'}
                      </span>
                    )
                  ) : (
                    <span className="italic text-slate-500">Drag screenshot here</span>
                  )}
                </div>

                {assignedCount > 0 && (
                  <div className="flex gap-1 mt-1.5 overflow-x-auto pb-1">
                    {group.imageIds.map((id) => {
                      const img = images.find((i) => i.id === id);
                      if (!img) return null;
                      return (
                        <div
                          key={id}
                          className="relative group/mini shrink-0 cursor-grab active:cursor-grabbing"
                          draggable={true}
                          onDragStart={(e) => {
                            e.stopPropagation();
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', id);
                            e.dataTransfer.setData('imageId', id);
                            e.dataTransfer.setData('sourceGroupId', group.id);
                            draggedImageIdRef.current = id;
                            draggedSourceGroupIdRef.current = group.id;
                            setDraggedImageId(id);
                            setDraggedSourceGroupId(group.id);
                          }}
                          onDragEnd={() => {
                            draggedImageIdRef.current = null;
                            draggedSourceGroupIdRef.current = null;
                            setDraggedImageId(null);
                            setDraggedSourceGroupId(null);
                            setDragOverGroupId(null);
                          }}
                        >
                          <img
                            src={img.dataUrl}
                            alt={img.name}
                            className="w-8 h-8 rounded object-cover border border-white/20"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImageFromGroup(id, group.id);
                            }}
                            className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover/mini:opacity-100 transition-all text-[8px]"
                            title="Remove from group"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Screenshot List Section (Draggable & Reorderable) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-300 font-semibold px-1">
          <span>Loaded Screenshots ({images.length})</span>
          <span className="text-[10px] text-slate-500">Drag to Group or Reorder</span>
        </div>

        {images.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-center p-4 text-slate-500">
            <ImageIcon className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-xs">No screenshots loaded yet.</p>
            <p className="text-[10px] text-slate-600 mt-1">Upload images or load samples above.</p>
          </div>
        ) : (
          images.map((imgObj, idx) => {
            const isActive = idx === currentIndex;
            const isDragOver = dragOverImageIndex === idx;

            return (
              <div
                key={imgObj.id}
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'copyMove';
                  e.dataTransfer.setData('text/plain', imgObj.id);
                  e.dataTransfer.setData('imageId', imgObj.id);
                  draggedImageIdRef.current = imgObj.id;
                  draggedSourceGroupIdRef.current = groups.find((g) => g.imageIds.includes(imgObj.id))?.id || null;
                  setDraggedImageId(imgObj.id);
                  setDraggedSourceGroupId(draggedSourceGroupIdRef.current);
                  setDraggedImageIndex(idx);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (draggedImageIndex !== null && draggedImageIndex !== idx) {
                    setDragOverImageIndex(idx);
                  }
                }}
                onDragLeave={() => {
                  setDragOverImageIndex(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverImageIndex(null);
                  if (draggedImageIndex !== null && draggedImageIndex !== idx) {
                    reorderImages(draggedImageIndex, idx);
                  }
                }}
                onDragEnd={() => {
                  draggedImageIdRef.current = null;
                  draggedSourceGroupIdRef.current = null;
                  setDraggedImageId(null);
                  setDraggedSourceGroupId(null);
                  setDraggedImageIndex(null);
                  setDragOverImageIndex(null);
                }}
                onClick={() => switchImage(idx)}
                className={`group relative rounded-xl border p-2 cursor-grab active:cursor-grabbing transition-all ${
                  isDragOver
                    ? 'border-indigo-400 bg-indigo-500/20 scale-[1.02]'
                    : isActive
                    ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                    : 'border-white/10 bg-[#1e1e1e]/50 hover:border-white/20 hover:bg-[#1e1e1e]'
                }`}
              >
                {/* Index badge & Drag Handle */}
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1">
                  <div className="w-5 h-5 rounded-full bg-slate-900/90 text-white font-bold text-[10px] flex items-center justify-center border border-white/20 shadow">
                    {idx + 1}
                  </div>
                  <GripVertical className="w-4 h-4 text-slate-400 opacity-60 group-hover:opacity-100" />
                </div>

                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(idx);
                  }}
                  className="absolute top-3 right-3 z-10 w-5 h-5 rounded-full bg-rose-500/80 text-white opacity-0 group-hover:opacity-100 hover:bg-rose-600 transition-all flex items-center justify-center shadow"
                  title="Remove image"
                >
                  <X className="w-3 h-3" />
                </button>

                {/* Reorder Up/Down Buttons */}
                <div className="absolute bottom-3 right-3 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  {idx > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        reorderImages(idx, idx - 1);
                      }}
                      className="w-5 h-5 rounded bg-slate-800/90 hover:bg-slate-700 text-white flex items-center justify-center border border-white/10"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                  )}
                  {idx < images.length - 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        reorderImages(idx, idx + 1);
                      }}
                      className="w-5 h-5 rounded bg-slate-800/90 hover:bg-slate-700 text-white flex items-center justify-center border border-white/10"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Thumbnail Image Preview */}
                <div className="w-full h-24 rounded-lg overflow-hidden bg-black/40 mb-1.5 border border-white/5 pointer-events-none">
                  <img
                    src={imgObj.dataUrl}
                    alt={imgObj.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Image info & Quick assign button */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-200 font-medium truncate max-w-[130px]">{imgObj.name}</span>
                  {activeGroupId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        assignImageToGroup(imgObj.id, activeGroupId);
                      }}
                      className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20"
                      title="Add to Active Group"
                    >
                      + Group
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
