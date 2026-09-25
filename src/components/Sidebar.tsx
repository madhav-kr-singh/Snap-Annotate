import React, { useRef, useState } from 'react';
import { useAppStore, sortGroupsNumerically } from '../store/useAppStore';
import { renderMergedGuideCanvas } from '../utils/canvas';
import { downloadCanvasAsPNG, exportAllGroupsAsZip } from '../utils/export';
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  Sparkles,
  Plus,
  Layers,
  FolderPlus,
  GripVertical,
  Download,
  Trash2,
  Archive,
  ChevronDown,
  ChevronRight,
  Move
} from 'lucide-react';

interface SidebarProps {
  width?: number;
  onImageUploaded?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ width = 320, onImageUploaded }) => {
  const {
    images,
    currentIndex,
    annotationsPerImage,
    addImage,
    switchImage,
    switchImageById,
    removeImage,
    groups,
    activeGroupId,
    createGroup,
    deleteGroup,
    setActiveGroupId,
    assignImageToGroup,
    moveImageBetweenGroups,
    removeImageFromGroup,
    reorderGroupImages,
    updateGroup,
    autoGroupImagesByName,
  } = useAppStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Drag and drop states for reordering images within and across groups
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [draggedSourceGroupId, setDraggedSourceGroupId] = useState<string | null>(null);
  const [dragOverImageId, setDragOverImageId] = useState<string | null>(null);
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  // Track collapsed state per group
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const processFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          addImage(file.name, dataUrl, img.width, img.height, img);
          onImageUploaded?.();
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
      ctx.fillRect(0, 0, 960, 50);
      ctx.fillStyle = '#f9fafb';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('Settings & Organization', 30, 32);

      ctx.fillStyle = '#1f2937';
      ctx.beginPath();
      ctx.roundRect(180, 80, 600, 480, 16);
      ctx.fill();

      ctx.fillStyle = '#f3f4f6';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('Edit Workspace Profile', 220, 130);

      const labels = ['Workspace Name', 'Domain URL', 'Admin Email', 'API Secret Key'];
      labels.forEach((label, idx) => {
        const y = 160 + idx * 75;
        ctx.fillStyle = '#9ca3af';
        ctx.font = '13px sans-serif';
        ctx.fillText(label, 220, y + 15);

        ctx.fillStyle = '#374151';
        ctx.beginPath();
        ctx.roundRect(220, y + 25, 520, 36, 8);
        ctx.fill();
      });

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.roundRect(620, 480, 120, 40, 8);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('Save Changes', 635, 505);
    }

    const dataUrl = canvas.toDataURL();
    const img = new Image();
    img.onload = () => {
      const name = type === 'dashboard' ? 'Analytics_Dashboard.png' : 'Settings_Form.png';
      addImage(name, dataUrl, 960, 600, img);
      onImageUploaded?.();
    };
    img.src = dataUrl;
  };

  // ponytail: export preserving exact group imageIds sequence
  const handleExportGroup = (group: typeof groups[0]) => {
    const groupImages = group.imageIds
      .map((id) => images.find((img) => img.id === id))
      .filter((img): img is (typeof images)[0] => Boolean(img));
    if (groupImages.length === 0) return;

    const groupAnnotations: Record<number, any> = {};
    groupImages.forEach((img, idx) => {
      const originalIdx = images.findIndex((i) => i.id === img.id);
      groupAnnotations[idx] = annotationsPerImage[originalIdx] || [];
    });

    const mergedCanvas = renderMergedGuideCanvas(groupImages, groupAnnotations, group);
    downloadCanvasAsPNG(mergedCanvas, `${group.name.replace(/\s+/g, '_')}_guide`);
  };

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

  const sortedGroups = sortGroupsNumerically(groups, images);
  const currentImg = currentIndex >= 0 ? images[currentIndex] : null;

  // Identify any images not assigned to any group
  const allAssignedIds = new Set(groups.flatMap((g) => g.imageIds));
  const ungroupedImages = images.filter((img) => !allAssignedIds.has(img.id));

  return (
    <aside
      className="bg-[#0d0d14] border-r border-white/[0.055] flex flex-col h-full shrink-0 select-none z-20 overflow-hidden"
      style={{ width }}
    >
      {/* Upload & Quick Add Header */}
      <div className="p-3 space-y-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.15)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-3.5 rounded-full" style={{ background: 'linear-gradient(180deg,#6366f1,#818cf8)' }} />
            <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              Groups & Screenshots ({images.length})
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => autoGroupImagesByName()}
              className="px-2 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
              title="Auto-Group Screenshots by Filename Number"
            >
              <Sparkles className="w-3 h-3" />
              <span>Auto</span>
            </button>
            <button
              onClick={() => createGroup()}
              className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
              title="Create New Guide Group"
            >
              <FolderPlus className="w-3 h-3" />
              <span>+ Group</span>
            </button>
          </div>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={handleDragOverFile}
          onDragLeave={handleDragLeaveFile}
          onDrop={handleDropFile}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all ${
            isDraggingFile
              ? 'border-indigo-500 bg-indigo-500/10'
              : 'border-white/15 hover:border-indigo-400/50 hover:bg-white/[0.02]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex items-center justify-center gap-2 text-indigo-400">
            <Upload className="w-4 h-4" />
            <span className="text-xs font-semibold text-slate-200">Upload Screenshots</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Drag & drop PNG, JPG, WebP</p>
        </div>

        {/* Sample screenshot loader buttons */}
        <div className="flex gap-1.5">
          <button
            onClick={() => createSampleScreenshot('dashboard')}
            className="flex-1 py-1 px-2 rounded-lg text-[10px] font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            <span>+ Dashboard</span>
          </button>
          <button
            onClick={() => createSampleScreenshot('form')}
            className="flex-1 py-1 px-2 rounded-lg text-[10px] font-semibold text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>+ Form UI</span>
          </button>
        </div>
      </div>

      {/* Main Group-Wise Images Explorer */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
        {sortedGroups.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-center p-4 text-slate-500">
            <ImageIcon className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-xs">No groups created yet.</p>
            <p className="text-[10px] text-slate-600 mt-1">Upload screenshots above to begin.</p>
          </div>
        ) : (
          sortedGroups.map((group, groupIdx) => {
            const isGroupActive = group.id === activeGroupId;
            const isGroupCollapsed = collapsedGroups[group.id] || false;
            const isTargetDrop = dragOverGroupId === group.id && !dragOverImageId;

            // Get ordered ImageItems for this group
            const groupImages = group.imageIds
              .map((id) => images.find((img) => img.id === id))
              .filter((img): img is (typeof images)[0] => Boolean(img));

            return (
              <div
                key={group.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOverGroupId(group.id);
                }}
                onDragLeave={(e) => {
                  e.stopPropagation();
                  if (dragOverGroupId === group.id && !dragOverImageId) {
                    setDragOverGroupId(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOverGroupId(null);
                  setDragOverImageId(null);

                  const imgId = draggedImageId || e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('imageId');
                  if (!imgId) return;

                  if (draggedSourceGroupId && draggedSourceGroupId !== group.id) {
                    moveImageBetweenGroups(imgId, draggedSourceGroupId, group.id);
                  } else if (!group.imageIds.includes(imgId)) {
                    assignImageToGroup(imgId, group.id);
                  }

                  setDraggedImageId(null);
                  setDraggedSourceGroupId(null);
                }}
                className={`rounded-xl border transition-all ${
                  isGroupActive
                    ? 'border-indigo-500/60 bg-indigo-500/[0.04] shadow-lg shadow-indigo-500/5'
                    : 'border-white/10 bg-[#1a1a1a]/60 hover:border-white/20'
                }`}
              >
                {/* Group Header */}
                <div
                  onClick={() => setActiveGroupId(group.id)}
                  className={`p-2.5 flex items-center justify-between gap-1.5 cursor-pointer rounded-t-xl transition-all ${
                    isGroupActive ? 'bg-indigo-500/10' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleGroupCollapse(group.id);
                      }}
                      className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
                      title={isGroupCollapsed ? 'Expand group' : 'Collapse group'}
                    >
                      {isGroupCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: group.borderColor || '#6366F1' }} />

                    <input
                      type="text"
                      value={group.name}
                      onChange={(e) => updateGroup(group.id, { name: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-transparent font-bold text-xs text-white focus:outline-none focus:border-b border-indigo-400 truncate flex-1 min-w-[80px]"
                      title="Click to rename group"
                    />

                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-300 shrink-0 font-bold">
                      {groupImages.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportGroup(group);
                      }}
                      disabled={groupImages.length === 0}
                      className="p-1 rounded text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-30 transition-all cursor-pointer"
                      title="Export Group PNG"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    {groups.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteGroup(group.id);
                        }}
                        className="p-1 rounded text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
                        title="Delete Group"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Group Images List (Visible when expanded) */}
                {!isGroupCollapsed && (
                  <div className="p-2 pt-0 space-y-2">
                    {groupImages.length === 0 ? (
                      <div
                        className={`p-3 rounded-lg border border-dashed text-center text-[11px] transition-all ${
                          isTargetDrop
                            ? 'border-indigo-400 bg-indigo-500/10 text-indigo-300'
                            : 'border-white/10 text-slate-500'
                        }`}
                      >
                        <Move className="w-4 h-4 mx-auto mb-1 opacity-40" />
                        <span>Drop screenshots here to add to this group</span>
                      </div>
                    ) : (
                      groupImages.map((img, imgIndex) => {
                        const isCurrentActive = currentImg?.id === img.id;
                        const isTargetImageDrop = dragOverImageId === img.id;
                        const displayNumber = imgIndex + 1;

                        return (
                          <div
                            key={img.id}
                            draggable={true}
                            onDragStart={(e) => {
                              e.stopPropagation();
                              e.dataTransfer.effectAllowed = 'move';
                              e.dataTransfer.setData('text/plain', img.id);
                              e.dataTransfer.setData('imageId', img.id);
                              e.dataTransfer.setData('sourceGroupId', group.id);
                              setDraggedImageId(img.id);
                              setDraggedSourceGroupId(group.id);
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              e.dataTransfer.dropEffect = 'move';
                              if (draggedImageId && draggedImageId !== img.id) {
                                setDragOverImageId(img.id);
                                setDragOverGroupId(group.id);
                              }
                            }}
                            onDragLeave={(e) => {
                              e.stopPropagation();
                              if (dragOverImageId === img.id) {
                                setDragOverImageId(null);
                              }
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDragOverImageId(null);
                              setDragOverGroupId(null);

                              const movingId = draggedImageId || e.dataTransfer.getData('text/plain');
                              if (!movingId || movingId === img.id) return;

                              if (draggedSourceGroupId === group.id) {
                                // ponytail: reorder images within same group so image numbers change (e.g. 2 -> 1)
                                reorderGroupImages(group.id, movingId, img.id);
                              } else if (draggedSourceGroupId) {
                                // ponytail: move from source group into target group before target image
                                moveImageBetweenGroups(movingId, draggedSourceGroupId, group.id, img.id);
                              }

                              setDraggedImageId(null);
                              setDraggedSourceGroupId(null);
                            }}
                            onDragEnd={() => {
                              setDraggedImageId(null);
                              setDraggedSourceGroupId(null);
                              setDragOverImageId(null);
                              setDragOverGroupId(null);
                            }}
                            onClick={() => {
                              setActiveGroupId(group.id);
                              switchImageById(img.id);
                            }}
                            title={img.name}
                            className={`group relative rounded-xl border p-2 cursor-grab active:cursor-grabbing transition-all ${
                              isTargetImageDrop
                                ? 'border-indigo-400 bg-indigo-500/20 scale-[1.02] shadow-lg shadow-indigo-500/20'
                                : isCurrentActive
                                ? 'border-indigo-500 bg-indigo-500/15 ring-1 ring-indigo-500/50 shadow-md shadow-indigo-500/15'
                                : 'border-white/10 bg-[#161616] hover:border-white/25 hover:bg-[#1a1a1a]'
                            }`}
                          >
                            {/* Card Body */}
                            <div className="flex items-center gap-2.5">
                              {/* Position Badge Number & Drag Grip */}
                              <div className="flex flex-col items-center justify-center shrink-0 gap-1">
                                <div
                                  className={`w-6 h-6 rounded-md font-['Plus_Jakarta_Sans'] font-extrabold text-xs flex items-center justify-center shadow-md transition-all ${
                                    isCurrentActive
                                      ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                                      : 'bg-slate-800 text-slate-200 border border-white/15 group-hover:bg-indigo-500/30 group-hover:text-white'
                                  }`}
                                  title={`Position #${displayNumber} in ${group.name} - Drag to change order`}
                                >
                                  {displayNumber}
                                </div>
                                <GripVertical className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
                              </div>

                              {/* Thumbnail preview */}
                              <div className="w-16 h-12 rounded-lg overflow-hidden bg-black/50 border border-white/10 shrink-0 relative pointer-events-none">
                                <img
                                  src={img.dataUrl}
                                  alt={img.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                              </div>

                              {/* Filename & Info */}
                              <div className="flex-1 min-w-0 pr-5">
                                <p
                                  className="text-xs font-semibold text-slate-200 truncate group-hover:text-indigo-300 transition-colors"
                                  title={img.name}
                                >
                                  {img.name}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                                  <span>{img.width} × {img.height}</span>
                                  {isCurrentActive && (
                                    <span className="text-emerald-400 font-bold font-sans">Active</span>
                                  )}
                                </div>
                              </div>

                              {/* Remove from group button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeImageFromGroup(img.id, group.id);
                                }}
                                className="absolute top-2 right-2 w-5 h-5 rounded-md bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                title="Remove screenshot from this group"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Prominent Hover Filename Tooltip */}
                            <div className="absolute left-2 bottom-full mb-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150 z-50 bg-[#1e1e2e] border border-indigo-500/40 text-indigo-200 font-mono text-[11px] px-2.5 py-1 rounded-md shadow-2xl backdrop-blur-md whitespace-nowrap max-w-[280px] truncate">
                              📄 {img.name}
                            </div>
                          </div>
                        );
                      })
                    )}

                    {/* Drop-at-the-end zone */}
                    {groupImages.length > 0 && (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragOverImageId('__end__');
                          setDragOverGroupId(group.id);
                        }}
                        onDragLeave={(e) => {
                          e.stopPropagation();
                          if (dragOverImageId === '__end__') {
                            setDragOverImageId(null);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragOverImageId(null);
                          setDragOverGroupId(null);

                          const movingId = draggedImageId || e.dataTransfer.getData('text/plain');
                          if (!movingId) return;

                          if (draggedSourceGroupId === group.id) {
                            reorderGroupImages(group.id, movingId, '__end__');
                          } else if (draggedSourceGroupId) {
                            moveImageBetweenGroups(movingId, draggedSourceGroupId, group.id, '__end__');
                          }

                          setDraggedImageId(null);
                          setDraggedSourceGroupId(null);
                        }}
                        className={`h-4 rounded border border-dashed transition-all ${
                          dragOverGroupId === group.id && dragOverImageId === '__end__'
                            ? 'border-indigo-400 bg-indigo-500/20'
                            : 'border-transparent hover:border-white/10'
                        }`}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Ungrouped Screenshots Section (if any exist) */}
        {ungroupedImages.length > 0 && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.03] p-2.5 space-y-2">
            <div className="flex items-center justify-between text-xs text-amber-300 font-bold px-1">
              <span>Ungrouped Screenshots ({ungroupedImages.length})</span>
              <span className="text-[10px] text-slate-500">Drag to any group</span>
            </div>
            {ungroupedImages.map((img) => (
              <div
                key={img.id}
                draggable={true}
                onDragStart={(e) => {
                  e.stopPropagation();
                  e.dataTransfer.setData('text/plain', img.id);
                  e.dataTransfer.setData('imageId', img.id);
                  setDraggedImageId(img.id);
                  setDraggedSourceGroupId(null);
                }}
                onDragEnd={() => {
                  setDraggedImageId(null);
                  setDraggedSourceGroupId(null);
                }}
                onClick={() => switchImageById(img.id)}
                title={img.name}
                className="group relative flex items-center justify-between p-2 rounded-lg bg-[#181818] border border-white/10 hover:border-amber-400/50 cursor-grab active:cursor-grabbing transition-all"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-12 h-9 rounded overflow-hidden bg-black border border-white/10 shrink-0">
                    <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-200 truncate">{img.name}</p>
                    <p className="text-[10px] text-slate-500">{img.width} × {img.height}</p>
                  </div>
                </div>

                {activeGroupId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      assignImageToGroup(img.id, activeGroupId);
                    }}
                    className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 shrink-0 cursor-pointer"
                    title="Add to selected group"
                  >
                    + Add
                  </button>
                )}

                {/* Hover Filename Tooltip */}
                <div className="absolute left-2 bottom-full mb-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150 z-50 bg-[#1e1e2e] border border-amber-500/40 text-amber-200 font-mono text-[11px] px-2.5 py-1 rounded-md shadow-2xl backdrop-blur-md whitespace-nowrap max-w-[280px] truncate">
                  📄 {img.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export All Zip Button at Bottom */}
      {images.length > 0 && (
        <div className="p-3 border-t border-white/10 bg-[#181818]/60">
          <button
            onClick={handleExportZip}
            disabled={isZipping}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Archive className="w-4 h-4" />
            <span>{isZipping ? 'Generating ZIP...' : 'Export All Groups (ZIP)'}</span>
          </button>
        </div>
      )}
    </aside>
  );
};
