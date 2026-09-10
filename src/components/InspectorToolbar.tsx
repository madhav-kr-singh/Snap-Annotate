import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { COLOR_PRESETS } from '../constants/theme';
import { BadgeStyle, BoxStyle, ConnectorStyle, ToolType } from '../types';
import { CustomSelect } from './CustomSelect';
import { 
  MousePointer, 
  CircleDot, 
  Square, 
  MessageSquare, 
  EyeOff, 
  Sliders, 
  Layers, 
  Type, 
  Palette, 
  Grid,
  Hash,
  RefreshCw,
  Plus,
  Minus,
  Trash2
} from 'lucide-react';

export const InspectorToolbar: React.FC = () => {
  const {
    images,
    currentIndex,
    annotationsPerImage,
    selectedAnnotationId,
    activeTool,
    setActiveTool,
    updateAnnotation,
    stepCounter,
    setStepCounter,
    renumberStepBadges,
    groups,
    activeGroupId,
    setActiveGroupId,
    updateGroup,
    pendingArrowTargetId,
    setPendingArrowTargetId,
  } = useAppStore();

  const currentAnnotations = currentIndex >= 0 ? annotationsPerImage[currentIndex] || [] : [];
  const selectedItem = currentAnnotations.find((item) => item.id === selectedAnnotationId) || null;
  const currentStepBadgesCount = currentAnnotations.filter((item) => item.type === 'stepNumber').length;

  const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0];

  return (
    <aside className="w-80 bg-[#121212] border-l border-white/10 flex flex-col h-full shrink-0 select-none overflow-y-auto">
      {/* Studio Tools Grid */}
      <div className="p-4 border-b border-white/10 space-y-3">
        <div className="flex items-center gap-2">
          <Grid className="w-4 h-4 text-indigo-400" />
          <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-xs uppercase tracking-wider text-slate-200">
            Studio Tools
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'select', label: 'Select', icon: MousePointer },
            { id: 'stepNumber', label: 'Step Badge', icon: CircleDot },
            { id: 'rectangle', label: 'Highlight Box', icon: Square },
            { id: 'textBox', label: 'Text Callout', icon: MessageSquare },
            { id: 'blur', label: 'Pixel Blur', icon: EyeOff },
          ].map((tool) => {
            const IconComponent = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id as ToolType)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  isActive
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-[#1e1e1e]/60 border-white/5 text-slate-300 hover:bg-[#1e1e1e] hover:border-white/15'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>

     

      {/* Selected Item Properties Panel */}
      <div className="p-4 border-b border-white/10 space-y-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-xs uppercase tracking-wider text-slate-200">
            {selectedItem ? `${selectedItem.type} Properties` : 'Item Properties'}
          </h2>
        </div>

        {!selectedItem ? (
          <div className="p-4 rounded-xl bg-[#1e1e1e]/40 border border-white/5 text-center text-slate-400 text-xs">
            Select any badge, box, or callout on the canvas to inspect and customize its shape, style, size, or colors.
          </div>
        ) : (
          <div className="space-y-3">
            {/* Text Area for Callout & Input for Badge */}
            {selectedItem.type === 'textBox' ? (
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-slate-400" />
                  <span>Callout Note Text</span>
                </label>
                <textarea
                  rows={3}
                  value={selectedItem.text}
                  onChange={(e) => updateAnnotation(selectedItem.id, { text: e.target.value })}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs text-white placeholder-slate-500 resize-none font-sans"
                  placeholder="Type note or callout details..."
                />
              </div>
            ) : selectedItem.type === 'stepNumber' ? (
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-slate-400" />
                  <span>Step Badge Text</span>
                </label>
                <input
                  type="text"
                  value={selectedItem.text}
                  onChange={(e) => updateAnnotation(selectedItem.id, { text: e.target.value })}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs text-white placeholder-slate-500"
                  placeholder="Step number or letter..."
                />
              </div>
            ) : null}

            {/* Badge Shape Picker */}
            {selectedItem.type === 'stepNumber' && (
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400">Badge Shape Variant</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'circle', label: 'Circle' },
                    { id: 'square', label: 'Square' },
                    { id: 'pill', label: 'Capsule Pill' },
                    { id: 'glow', label: 'Glow Circle' },
                  ].map((shape) => (
                    <button
                      key={shape.id}
                      onClick={() => updateAnnotation(selectedItem.id, { badgeStyle: shape.id as BadgeStyle })}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all ${
                        (selectedItem.badgeStyle || 'circle') === shape.id
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow'
                          : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {shape.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Highlight Box Style Picker */}
            {selectedItem.type === 'rectangle' && (
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400">Highlight Box Style</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'solid', label: 'Solid Stroke' },
                    { id: 'filled', label: 'Filled Tint' },
                    { id: 'dashed', label: 'Dashed Focus' },
                    { id: 'glow', label: 'Glowing Spotlight' },
                  ].map((style) => (
                    <button
                      key={style.id}
                      onClick={() => updateAnnotation(selectedItem.id, { boxStyle: style.id as BoxStyle })}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all ${
                        (selectedItem.boxStyle || 'solid') === style.id
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow'
                          : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Corner Radius Slider */}
            {(selectedItem.type === 'rectangle' || selectedItem.type === 'textBox') && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-medium text-slate-400">
                  <span>Corner Radius</span>
                  <span className="font-mono text-white">{selectedItem.cornerRadius || 8}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={selectedItem.cornerRadius || 8}
                  onChange={(e) => updateAnnotation(selectedItem.id, { cornerRadius: Number(e.target.value) })}
                  className="w-full accent-indigo-500 bg-white/10 h-1.5 rounded-lg cursor-pointer"
                />
              </div>
            )}

            {/* Size Slider for Badge */}
            {selectedItem.type === 'stepNumber' && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-medium text-slate-400">
                  <span>Badge Diameter</span>
                  <span className="font-mono text-white">{selectedItem.size}px</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="64"
                  value={selectedItem.size}
                  onChange={(e) => updateAnnotation(selectedItem.id, { size: Number(e.target.value) })}
                  className="w-full accent-indigo-500 bg-white/10 h-1.5 rounded-lg cursor-pointer"
                />
              </div>
            )}

            {/* Font Size for Callout Box */}
            {selectedItem.type === 'textBox' && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-medium text-slate-400">
                  <span>Font Size</span>
                  <span className="font-mono text-white">{selectedItem.fontSize || 13}px</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="28"
                  value={selectedItem.fontSize || 13}
                  onChange={(e) => updateAnnotation(selectedItem.id, { fontSize: Number(e.target.value) })}
                  className="w-full accent-indigo-500 bg-white/10 h-1.5 rounded-lg cursor-pointer"
                />
              </div>
            )}

            {/* Border Thickness */}
            {(selectedItem.type === 'rectangle' || selectedItem.type === 'textBox') && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-medium text-slate-400">
                  <span>Border Thickness</span>
                  <span className="font-mono text-white">{selectedItem.borderWidth || 3}px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={selectedItem.borderWidth || 3}
                  onChange={(e) => updateAnnotation(selectedItem.id, { borderWidth: Number(e.target.value) })}
                  className="w-full accent-indigo-500 bg-white/10 h-1.5 rounded-lg cursor-pointer"
                />
              </div>
            )}

            {/* Multi-Arrow Pointer Manager for Text Callouts */}
            {selectedItem.type === 'textBox' && (() => {
              const currentTargets = selectedItem.targetPoints && selectedItem.targetPoints.length > 0
                ? selectedItem.targetPoints
                : selectedItem.targetPoint
                ? [selectedItem.targetPoint]
                : [];

              const isTargeting = pendingArrowTargetId === selectedItem.id;

              const handleAddArrow = () => {
                if (isTargeting) {
                  setPendingArrowTargetId(null);
                } else {
                  setPendingArrowTargetId(selectedItem.id);
                }
              };

              const handleRemoveArrow = (index: number) => {
                const nextTargets = currentTargets.filter((_, i) => i !== index);
                updateAnnotation(selectedItem.id, {
                  targetPoints: nextTargets,
                  targetPoint: nextTargets.length > 0 ? nextTargets[0] : null,
                });
              };

              return (
                <div className="space-y-3 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <label className="text-[11px] font-medium text-slate-300">Arrow Pointers</label>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {currentTargets.length}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddArrow}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold text-white transition-all shadow-md flex items-center gap-1 active:scale-95 cursor-pointer ${
                        isTargeting
                          ? 'bg-amber-600 hover:bg-amber-500 border border-amber-400/40 animate-pulse'
                          : 'bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/30 shadow-indigo-600/20'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isTargeting ? 'Click Canvas...' : '+ Add Arrow'}</span>
                    </button>
                  </div>

                  {/* List of active arrow targets */}
                  {currentTargets.length > 0 && (
                    <div className="space-y-1.5">
                      {currentTargets.map((pt, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#1e1e1e]/80 border border-white/5 text-[11px]"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 font-mono text-[9px] font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-slate-300 font-medium">Arrow Target #{idx + 1}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveArrow(idx)}
                            className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all cursor-pointer"
                            title="Remove this arrow"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Arrow type selector */}
                  {currentTargets.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[11px] font-medium text-slate-300 tracking-wide">Arrow type</label>
                      <div className="flex items-center gap-2">
                        {[
                          {
                            id: 'straight',
                            label: 'Straight Arrow',
                            icon: (
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="19" x2="19" y2="5" />
                                <polyline points="11 5 19 5 19 11" />
                              </svg>
                            ),
                          },
                          {
                            id: 'curved',
                            label: 'Curved Arc Arrow',
                            icon: (
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 18 C 7 10, 13 6, 19 7" />
                                <polyline points="13 3 19 7 14 12" />
                              </svg>
                            ),
                          },
                          {
                            id: 'elbow',
                            label: 'Step S-Curve Arrow',
                            icon: (
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 18 V 11 Q 4 6 9 6 H 18" />
                                <polyline points="14 2 19 6 14 10" />
                              </svg>
                            ),
                          },
                        ].map((arrow) => {
                          const isSelected = (selectedItem.connectorStyle || 'straight') === arrow.id;
                          return (
                            <button
                              key={arrow.id}
                              type="button"
                              onClick={() => updateAnnotation(selectedItem.id, { connectorStyle: arrow.id as ConnectorStyle })}
                              className={`w-12 h-11 rounded-xl flex items-center justify-center transition-all border cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-600/35 border-indigo-400 text-white shadow-lg shadow-indigo-500/25 scale-[1.03] ring-2 ring-indigo-400/40'
                                  : 'bg-[#1e1e1e]/80 border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20'
                              }`}
                              title={arrow.label}
                            >
                              {arrow.icon}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Color Swatches */}
            {selectedItem.type !== 'blur' && (
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-slate-400" />
                  <span>Accent / Border Color</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() =>
                        updateAnnotation(selectedItem.id, {
                          color: preset.value,
                          borderColor: preset.value,
                        })
                      }
                      className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                        selectedItem.color === preset.value ? 'border-white scale-110 shadow-md' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: preset.value }}
                      title={preset.name}
                    />
                  ))}
                  <input
                    type="color"
                    value={selectedItem.color}
                    onChange={(e) =>
                      updateAnnotation(selectedItem.id, {
                        color: e.target.value,
                        borderColor: e.target.value,
                      })
                    }
                    className="w-6 h-6 rounded-full bg-transparent border-0 cursor-pointer overflow-hidden"
                  />
                </div>
              </div>
            )}

            {/* Box Background Color Picker for Text Callouts */}
            {selectedItem.type === 'textBox' && (
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Box Background Color</span>
                  </label>
                  <span className="font-mono text-[10px] text-indigo-300 font-bold">
                    {selectedItem.backgroundColor || '#1E1E24'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  {[
                    { name: 'Dark Slate', value: '#1E1E24' },
                    { name: 'Midnight', value: '#0F172A' },
                    { name: 'Pure Black', value: '#000000' },
                    { name: 'Dark Indigo', value: '#1E1B4B' },
                    { name: 'Dark Red', value: '#450A0A' },
                    { name: 'Dark Emerald', value: '#064E3B' },
                    { name: 'Pure White', value: '#FFFFFF' },
                    { name: 'Light Gray', value: '#F1F5F9' },
                    { name: 'Transparent', value: 'transparent' },
                  ].map((bg) => (
                    <button
                      key={bg.value}
                      onClick={() => updateAnnotation(selectedItem.id, { backgroundColor: bg.value })}
                      className={`w-6 h-6 rounded-lg border-2 transition-all hover:scale-110 flex items-center justify-center cursor-pointer ${
                        selectedItem.backgroundColor === bg.value
                          ? 'border-emerald-400 scale-110 shadow-md ring-2 ring-emerald-400/40'
                          : 'border-white/20 hover:border-white/40'
                      }`}
                      style={{
                        backgroundColor: bg.value === 'transparent' ? '#181926' : bg.value,
                      }}
                      title={bg.name}
                    >
                      {bg.value === 'transparent' && <span className="text-[9px] font-extrabold text-slate-400">ø</span>}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={
                      selectedItem.backgroundColor && selectedItem.backgroundColor !== 'transparent'
                        ? selectedItem.backgroundColor
                        : '#1E1E24'
                    }
                    onChange={(e) => updateAnnotation(selectedItem.id, { backgroundColor: e.target.value })}
                    className="w-6 h-6 rounded-lg bg-transparent border-0 cursor-pointer overflow-hidden"
                    title="Custom Background Color"
                  />
                </div>
              </div>
            )}

            {/* Text / Font Color Picker for Text Callouts & Badges */}
            {(selectedItem.type === 'textBox' || selectedItem.type === 'stepNumber') && (
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Text / Font Color</span>
                  </label>
                  <span className="font-mono text-[10px] text-indigo-300 font-bold">
                    {selectedItem.textColor || '#FFFFFF'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  {[
                    { name: 'Pure White', value: '#FFFFFF' },
                    { name: 'Light Slate', value: '#E2E8F0' },
                    { name: 'Pure Black', value: '#000000' },
                    { name: 'Amber Yellow', value: '#F59E0B' },
                    { name: 'Emerald Green', value: '#10B981' },
                    { name: 'Cyan Blue', value: '#06B6D4' },
                    { name: 'Indigo Purple', value: '#6366F1' },
                    { name: 'Rose Red', value: '#F43F5E' },
                  ].map((tc) => (
                    <button
                      key={tc.value}
                      onClick={() => updateAnnotation(selectedItem.id, { textColor: tc.value })}
                      className={`w-6 h-6 rounded-lg border-2 transition-all hover:scale-110 flex items-center justify-center cursor-pointer ${
                        selectedItem.textColor === tc.value
                          ? 'border-emerald-400 scale-110 shadow-md ring-2 ring-emerald-400/40'
                          : 'border-white/20 hover:border-white/40'
                      }`}
                      style={{ backgroundColor: tc.value }}
                      title={tc.name}
                    />
                  ))}
                  <input
                    type="color"
                    value={selectedItem.textColor || '#FFFFFF'}
                    onChange={(e) => updateAnnotation(selectedItem.id, { textColor: e.target.value })}
                    className="w-6 h-6 rounded-lg bg-transparent border-0 cursor-pointer overflow-hidden"
                    title="Custom Text Color"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active Guide Group Settings */}
      {activeGroup && (
        <div className="p-4 space-y-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-[11px] uppercase tracking-wider text-slate-200 truncate whitespace-nowrap">
                Group Config ({activeGroup.name})
              </h2>
            </div>
            <CustomSelect
              value={activeGroupId || activeGroup.id}
              onChange={(val) => setActiveGroupId(val)}
              options={groups.map((g) => ({ value: g.id, label: g.name }))}
            />
          </div>

          <div className="p-3 rounded-xl bg-[#1e1e1e]/60 border border-white/5 space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-400">Stack Alignment</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateGroup(activeGroup.id, { layout: 'vertical' })}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    activeGroup.layout === 'vertical'
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  Vertical Stack
                </button>
                <button
                  onClick={() => updateGroup(activeGroup.id, { layout: 'horizontal' })}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    activeGroup.layout === 'horizontal'
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  Horizontal Stack
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-medium text-slate-400">
                <span>Frame Border Thickness</span>
                <span className="font-mono text-white">{activeGroup.borderWidth}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="24"
                value={activeGroup.borderWidth}
                onChange={(e) => updateGroup(activeGroup.id, { borderWidth: Number(e.target.value) })}
                className="w-full accent-indigo-500 bg-white/10 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-medium text-slate-400">
                <span>Image Divider Spacing</span>
                <span className="font-mono text-white">{activeGroup.spacing}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="48"
                value={activeGroup.spacing}
                onChange={(e) => updateGroup(activeGroup.id, { spacing: Number(e.target.value) })}
                className="w-full accent-indigo-500 bg-white/10 h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px] font-medium text-slate-400">
                <span>Frame & Divider Color</span>
                <input
                  type="color"
                  value={activeGroup.borderColor}
                  onChange={(e) => updateGroup(activeGroup.id, { borderColor: e.target.value })}
                  className="w-6 h-6 rounded-full bg-transparent border-0 cursor-pointer overflow-hidden"
                />
              </div>
            </div>
          </div>
        </div>
      )}

       {/* Group Stepper Manager Panel */}
      <div className="p-4 border-b border-white/10 space-y-3 bg-indigo-500/[0.02]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-indigo-400" />
            <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-xs uppercase tracking-wider text-slate-200">
              Group Stepper Manager
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {currentStepBadgesCount} Badges
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[#1e1e1e]/70 border border-white/5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Next Step Number:</span>
            <div className="flex items-center gap-1.5 bg-[#26283b] p-1 rounded-lg border border-white/10">
              <button
                onClick={() => setStepCounter((c) => Math.max(1, c - 1))}
                className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 text-white flex items-center justify-center"
              >
                <Minus className="w-3 h-3" />
              </button>
              <input
                type="number"
                min="1"
                value={stepCounter}
                onChange={(e) => setStepCounter(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-10 text-center font-mono font-bold text-indigo-300 bg-transparent focus:outline-none text-xs"
              />
              <button
                onClick={() => setStepCounter((c) => c + 1)}
                className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 text-white flex items-center justify-center"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          <button
            onClick={renumberStepBadges}
            disabled={currentStepBadgesCount === 0}
            className="w-full py-1.5 px-3 rounded-xl text-xs font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Auto Renumber Badges (1 → {currentStepBadgesCount || 1})</span>
          </button>
        </div>
      </div>
      
    </aside>
  );
};
