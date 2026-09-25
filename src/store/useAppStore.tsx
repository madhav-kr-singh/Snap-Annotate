import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnnotationItem, ImageItem, AnnotationGroup, ToolType } from '../types';

interface AppState {
  images: ImageItem[];
  currentIndex: number;
  annotationsPerImage: Record<number, AnnotationItem[]>;
  undoStackPerImage: Record<number, AnnotationItem[][]>;
  redoStackPerImage: Record<number, AnnotationItem[][]>;
  selectedAnnotationId: string | null;
  activeTool: ToolType;
  stepCounter: number;
  groups: AnnotationGroup[];
  activeGroupId: string | null;
  pendingArrowTargetId: string | null;
  setPendingArrowTargetId: (id: string | null) => void;

  // Actions
  addImage: (name: string, dataUrl: string, width: number, height: number, imgElement: HTMLImageElement) => void;
  switchImage: (index: number) => void;
  switchImageById: (id: string) => void;
  removeImage: (index: number) => void;
  reorderImages: (draggedIndex: number, targetIndex: number) => void;
  addAnnotation: (item: AnnotationItem) => void;
  updateAnnotation: (id: string, updates: Partial<AnnotationItem>) => void;
  deleteAnnotation: (id: string) => void;
  setSelectedAnnotationId: (id: string | null) => void;
  setActiveTool: (tool: ToolType) => void;
  setStepCounter: React.Dispatch<React.SetStateAction<number>>;
  renumberStepBadges: () => void;
  recolorAllBadges: (color: string) => void;
  undo: () => void;
  redo: () => void;
  clearAll: () => void;

  // Group Management Actions
  createGroup: (name?: string) => void;
  deleteGroup: (groupId: string) => void;
  setActiveGroupId: (groupId: string | null) => void;
  assignImageToGroup: (imageId: string, groupId: string) => void;
  moveImageBetweenGroups: (imageId: string, sourceGroupId: string, targetGroupId: string, targetImageId?: string) => void;
  removeImageFromGroup: (imageId: string, groupId: string) => void;
  reorderGroupImages: (groupId: string, draggedId: string, targetId: string) => void;
  updateGroup: (groupId: string, updates: Partial<AnnotationGroup>) => void;
  autoGroupImagesByName: () => void;

  canUndo: boolean;
  canRedo: boolean;
}

const AppContext = createContext<AppState | null>(null);

// ponytail: default to clean "Group 1" so uploaded screenshots land together in group 1
const DEFAULT_GROUP: AnnotationGroup = {
  id: 'group_1',
  name: 'Group 1',
  imageIds: [],
  layout: 'vertical',
  borderColor: '#34C759',
  borderWidth: 6,
  spacing: 12,
};

export const extractGroupNumber = (group: AnnotationGroup, imagesList: ImageItem[] = []): number => {
  // 1. Check group id (e.g. group_num_2 -> 2)
  const idMatch = group.id.match(/^group_num_(\d+)/);
  if (idMatch) return parseInt(idMatch[1], 10);

  // 2. Check group name (e.g. "Group 2", "2", "2 x", "Guide 2")
  const nameMatch = group.name.match(/(\d+)/);
  if (nameMatch) return parseInt(nameMatch[1], 10);

  // 3. Check first image in group if available
  if (imagesList.length > 0 && group.imageIds.length > 0) {
    const firstImg = imagesList.find((img) => img.id === group.imageIds[0]);
    if (firstImg) {
      const imgNumMatch = firstImg.name.trim().match(/^\s*(\d+)/);
      if (imgNumMatch) return parseInt(imgNumMatch[1], 10);
    }
  }

  return Number.MAX_SAFE_INTEGER;
};

export const sortGroupsNumerically = (
  groupsList: AnnotationGroup[],
  imagesList: ImageItem[] = []
): AnnotationGroup[] => {
  return [...groupsList].sort((a, b) => {
    const numA = extractGroupNumber(a, imagesList);
    const numB = extractGroupNumber(b, imagesList);

    if (numA !== numB) {
      return numA - numB;
    }

    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
  });
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [annotationsPerImage, setAnnotationsPerImage] = useState<Record<number, AnnotationItem[]>>({});
  const [undoStackPerImage, setUndoStackPerImage] = useState<Record<number, AnnotationItem[][]>>({});
  const [redoStackPerImage, setRedoStackPerImage] = useState<Record<number, AnnotationItem[][]>>({});
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [stepCounter, setStepCounter] = useState<number>(1);
  
  const [groups, setGroups] = useState<AnnotationGroup[]>([DEFAULT_GROUP]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>('group_1');
  const [pendingArrowTargetId, setPendingArrowTargetId] = useState<string | null>(null);

  // Save current annotations state to undo history
  const pushHistory = useCallback(
    (indexToSave: number, currentList: AnnotationItem[]) => {
      setUndoStackPerImage((prev) => {
        const stack = prev[indexToSave] || [];
        return {
          ...prev,
          [indexToSave]: [...stack, JSON.parse(JSON.stringify(currentList))],
        };
      });
      setRedoStackPerImage((prev) => ({ ...prev, [indexToSave]: [] }));
    },
    []
  );

  const addImage = useCallback(
    (name: string, dataUrl: string, width: number, height: number, imgElement: HTMLImageElement) => {
      const newImg: ImageItem = {
        id: String(Date.now() + Math.random()),
        name,
        dataUrl,
        width,
        height,
        imgElement,
      };

      setImages((prev) => {
        const nextImages = [...prev, newImg];
        const nextIndex = nextImages.length - 1;

        setAnnotationsPerImage((ann) => ({ ...ann, [nextIndex]: [] }));
        setUndoStackPerImage((u) => ({ ...u, [nextIndex]: [] }));
        setRedoStackPerImage((r) => ({ ...r, [nextIndex]: [] }));

        if (currentIndex === -1) {
          setCurrentIndex(0);
        }

        // ponytail: group incoming images into active group, or by filename prefix if specified
        const numMatch = name.trim().match(/^(?:group|grp|g)?[_\s-]*(\d+)/i);

        setGroups((prevGroups) => {
          let baseGroups = [...prevGroups];
          if (baseGroups.length === 0) {
            baseGroups = [DEFAULT_GROUP];
          }

          let updatedGroups: AnnotationGroup[];

          if (numMatch) {
            const majorNum = numMatch[1];
            const targetGroupId = `group_num_${majorNum}`;
            const targetGroupName = `Group ${majorNum}`;

            const existingIdx = baseGroups.findIndex(
              (g) => g.id === targetGroupId || g.name === targetGroupName
            );

            if (existingIdx !== -1) {
              const updated = [...baseGroups];
              updated[existingIdx] = {
                ...updated[existingIdx],
                imageIds: [...updated[existingIdx].imageIds.filter((id) => id !== newImg.id), newImg.id],
              };
              updatedGroups = updated;
            } else {
              const newG: AnnotationGroup = {
                id: targetGroupId,
                name: targetGroupName,
                imageIds: [newImg.id],
                layout: 'vertical',
                borderColor: '#34C759',
                borderWidth: 6,
                spacing: 12,
              };
              updatedGroups = [...baseGroups, newG];
            }
          } else {
            // ponytail: add into active group so all uploaded images stay together
            const targetId = activeGroupId || baseGroups[0].id;
            const targetIdx = baseGroups.findIndex((g) => g.id === targetId);
            if (targetIdx !== -1) {
              const updated = [...baseGroups];
              updated[targetIdx] = {
                ...updated[targetIdx],
                imageIds: [...updated[targetIdx].imageIds.filter((id) => id !== newImg.id), newImg.id],
              };
              updatedGroups = updated;
            } else {
              const updated = [...baseGroups];
              updated[0] = {
                ...updated[0],
                imageIds: [...updated[0].imageIds.filter((id) => id !== newImg.id), newImg.id],
              };
              updatedGroups = updated;
            }
          }

          return sortGroupsNumerically(updatedGroups, nextImages);
        });

        return nextImages;
      });
    },
    [currentIndex, activeGroupId]
  );

  const switchImage = useCallback((index: number) => {
    setImages((currentImages) => {
      if (index >= 0 && index < currentImages.length) {
        setCurrentIndex(index);
        setSelectedAnnotationId(null);
      }
      return currentImages;
    });
  }, []);

  // ponytail: direct O(1) lookup image switch by unique ID
  const switchImageById = useCallback((id: string) => {
    setImages((currentImages) => {
      const idx = currentImages.findIndex((img) => img.id === id);
      if (idx !== -1) {
        setCurrentIndex(idx);
        setSelectedAnnotationId(null);
      }
      return currentImages;
    });
  }, []);

  const removeImage = useCallback((index: number) => {
    setImages((prev) => {
      const targetImg = prev[index];
      const nextImages = prev.filter((_, i) => i !== index);

      if (targetImg) {
        // Remove image ID from all groups
        setGroups((prevGroups) =>
          prevGroups.map((g) => ({
            ...g,
            imageIds: g.imageIds.filter((id) => id !== targetImg.id),
          }))
        );
      }

      if (nextImages.length === 0) {
        setCurrentIndex(-1);
      } else {
        setCurrentIndex((curr) => (curr >= nextImages.length ? nextImages.length - 1 : curr));
      }
      return nextImages;
    });
  }, []);

  const reorderImages = useCallback((draggedIndex: number, targetIndex: number) => {
    setImages((prev) => {
      const result = [...prev];
      const [removed] = result.splice(draggedIndex, 1);
      result.splice(targetIndex, 0, removed);
      return result;
    });

    // ponytail: reorder annotationsPerImage so annotations remain attached to the right image
    setAnnotationsPerImage((prev) => {
      const copy: Record<number, AnnotationItem[]> = {};
      const keys = Object.keys(prev).map(Number);
      const maxIdx = Math.max(...keys, draggedIndex, targetIndex);
      const arr: AnnotationItem[][] = [];
      for (let i = 0; i <= maxIdx; i++) arr[i] = prev[i] || [];
      const [removedAnn] = arr.splice(draggedIndex, 1);
      arr.splice(targetIndex, 0, removedAnn);
      arr.forEach((annList, idx) => {
        copy[idx] = annList;
      });
      return copy;
    });

    setCurrentIndex(targetIndex);
  }, []);

  const addAnnotation = useCallback(
    (item: AnnotationItem) => {
      if (currentIndex === -1) return;
      const currentList = annotationsPerImage[currentIndex] || [];
      pushHistory(currentIndex, currentList);

      setAnnotationsPerImage((prev) => ({
        ...prev,
        [currentIndex]: [...(prev[currentIndex] || []), item],
      }));
      setSelectedAnnotationId(item.id);
    },
    [currentIndex, annotationsPerImage, pushHistory]
  );

  const updateAnnotation = useCallback(
    (id: string, updates: Partial<AnnotationItem>) => {
      if (currentIndex === -1) return;

      setAnnotationsPerImage((prev) => {
        const list = prev[currentIndex] || [];
        const nextList = list.map((item) => (item.id === id ? { ...item, ...updates } : item));
        return { ...prev, [currentIndex]: nextList };
      });
    },
    [currentIndex]
  );

  const deleteAnnotation = useCallback(
    (id: string) => {
      if (currentIndex === -1) return;
      const currentList = annotationsPerImage[currentIndex] || [];
      pushHistory(currentIndex, currentList);

      setAnnotationsPerImage((prev) => ({
        ...prev,
        [currentIndex]: (prev[currentIndex] || []).filter((item) => item.id !== id),
      }));
      setSelectedAnnotationId(null);
    },
    [currentIndex, annotationsPerImage, pushHistory]
  );

  const renumberStepBadges = useCallback(() => {
    if (currentIndex === -1) return;
    const currentList = annotationsPerImage[currentIndex] || [];
    if (currentList.length === 0) return;

    pushHistory(currentIndex, currentList);

    const stepItems = currentList.filter((item) => item.type === 'stepNumber');
    const otherItems = currentList.filter((item) => item.type !== 'stepNumber');

    stepItems.sort((a, b) => {
      if (Math.abs(a.position.y - b.position.y) > 20) {
        return a.position.y - b.position.y;
      }
      return a.position.x - b.position.x;
    });

    const renumberedSteps = stepItems.map((item, idx) => ({
      ...item,
      text: String(idx + 1),
    }));

    setAnnotationsPerImage((prev) => ({
      ...prev,
      [currentIndex]: [...otherItems, ...renumberedSteps],
    }));

    setStepCounter(renumberedSteps.length + 1);
  }, [currentIndex, annotationsPerImage, pushHistory]);

  const recolorAllBadges = useCallback(
    (color: string) => {
      if (currentIndex === -1) return;
      const currentList = annotationsPerImage[currentIndex] || [];
      pushHistory(currentIndex, currentList);

      setAnnotationsPerImage((prev) => ({
        ...prev,
        [currentIndex]: (prev[currentIndex] || []).map((item) =>
          item.type === 'stepNumber' ? { ...item, color, backgroundColor: color } : item
        ),
      }));
    },
    [currentIndex, annotationsPerImage, pushHistory]
  );

  // Group Management Actions
  const createGroup = useCallback((name?: string) => {
    const newGroup: AnnotationGroup = {
      id: String(Date.now()),
      name: name || `Guide Group ${groups.length + 1}`,
      imageIds: [],
      layout: 'vertical',
      borderColor: '#34C759',
      borderWidth: 6,
      spacing: 12,
    };
    setGroups((prev) => sortGroupsNumerically([...prev, newGroup], images));
    setActiveGroupId(newGroup.id);
  }, [groups.length, images]);

  const deleteGroup = useCallback((groupId: string) => {
    setGroups((prev) => {
      const next = prev.filter((g) => g.id !== groupId);
      if (next.length === 0) {
        const fallback = { ...DEFAULT_GROUP, id: String(Date.now()) };
        setActiveGroupId(fallback.id);
        return [fallback];
      }
      if (activeGroupId === groupId) {
        setActiveGroupId(next[0].id);
      }
      return next;
    });
  }, [activeGroupId]);

  const assignImageToGroup = useCallback((imageId: string, groupId: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          if (!g.imageIds.includes(imageId)) {
            return { ...g, imageIds: [...g.imageIds, imageId] };
          }
          return g;
        }
        // Remove imageId from all other groups so images are exclusively moved to target group
        return { ...g, imageIds: g.imageIds.filter((id) => id !== imageId) };
      })
    );
  }, []);

  const moveImageBetweenGroups = useCallback(
    (imageId: string, sourceGroupId: string, targetGroupId: string, targetImageId?: string) => {
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id === sourceGroupId && sourceGroupId !== targetGroupId) {
            return { ...g, imageIds: g.imageIds.filter((id) => id !== imageId) };
          }
          if (g.id === targetGroupId) {
            const list = g.imageIds.filter((id) => id !== imageId);
            if (targetImageId && targetImageId !== '__end__') {
              const targetIdx = list.indexOf(targetImageId);
              if (targetIdx !== -1) {
                list.splice(targetIdx, 0, imageId);
                return { ...g, imageIds: list };
              }
            }
            list.push(imageId);
            return { ...g, imageIds: list };
          }
          return g;
        })
      );
    },
    []
  );

  const removeImageFromGroup = useCallback((imageId: string, groupId: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          return { ...g, imageIds: g.imageIds.filter((id) => id !== imageId) };
        }
        return g;
      })
    );
  }, []);

  const reorderGroupImages = useCallback((groupId: string, draggedId: string, targetId: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          const list = [...g.imageIds];
          const draggedIdx = list.indexOf(draggedId);
          if (draggedIdx === -1) return g;
          // ponytail: remove dragged item first to avoid index shifting when dropping
          list.splice(draggedIdx, 1);
          if (targetId === '__end__') {
            list.push(draggedId);
          } else {
            const targetIdx = list.indexOf(targetId);
            if (targetIdx !== -1) {
              list.splice(targetIdx, 0, draggedId);
            } else {
              list.push(draggedId);
            }
          }
          return { ...g, imageIds: list };
        }
        return g;
      })
    );
  }, []);

  const updateGroup = useCallback((groupId: string, updates: Partial<AnnotationGroup>) => {
    setGroups((prev) =>
      sortGroupsNumerically(
        prev.map((g) => (g.id === groupId ? { ...g, ...updates } : g)),
        images
      )
    );
  }, [images]);

  const autoGroupImagesByName = useCallback(() => {
    setImages((currentImages) => {
      if (currentImages.length === 0) return currentImages;

      const numberGroupMap: Record<string, { id: string; name: string; imageIds: string[] }> = {};
      const textGroups: { id: string; name: string; imageIds: string[] }[] = [];

      currentImages.forEach((img) => {
        const filename = img.name.trim();
        const numMatch = filename.match(/^\s*(\d+)/);

        if (numMatch) {
          const majorNum = numMatch[1];
          const groupKey = `group_num_${majorNum}`;
          if (!numberGroupMap[majorNum]) {
            numberGroupMap[majorNum] = {
              id: groupKey,
              name: `Group ${majorNum}`,
              imageIds: [],
            };
          }
          numberGroupMap[majorNum].imageIds.push(img.id);
        } else {
          const baseName = filename.replace(/\.[^/.]+$/, '').trim() || 'Untitled';
          textGroups.push({
            id: `group_text_${img.id}`,
            name: `Guide: ${baseName}`,
            imageIds: [img.id],
          });
        }
      });

      const sortedNumKeys = Object.keys(numberGroupMap).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

      const finalGroups: AnnotationGroup[] = [];

      sortedNumKeys.forEach((key) => {
        const g = numberGroupMap[key];
        finalGroups.push({
          id: g.id,
          name: g.name,
          imageIds: g.imageIds,
          layout: 'vertical',
          borderColor: '#34C759',
          borderWidth: 6,
          spacing: 12,
        });
      });

      textGroups.forEach((g) => {
        finalGroups.push({
          id: g.id,
          name: g.name,
          imageIds: g.imageIds,
          layout: 'vertical',
          borderColor: '#6366F1',
          borderWidth: 6,
          spacing: 12,
        });
      });

      const sortedFinal = sortGroupsNumerically(finalGroups, currentImages);

      if (sortedFinal.length > 0) {
        setGroups(sortedFinal);
        setActiveGroupId(sortedFinal[0].id);
      }

      return currentImages;
    });
  }, []);

  const undo = useCallback(() => {
    if (currentIndex === -1) return;
    const uStack = undoStackPerImage[currentIndex] || [];
    if (uStack.length === 0) return;

    const currentList = annotationsPerImage[currentIndex] || [];
    const previousSnapshot = uStack[uStack.length - 1];

    setRedoStackPerImage((prev) => ({
      ...prev,
      [currentIndex]: [...(prev[currentIndex] || []), JSON.parse(JSON.stringify(currentList))],
    }));

    setUndoStackPerImage((prev) => ({
      ...prev,
      [currentIndex]: uStack.slice(0, uStack.length - 1),
    }));

    setAnnotationsPerImage((prev) => ({
      ...prev,
      [currentIndex]: previousSnapshot,
    }));
    setSelectedAnnotationId(null);
  }, [currentIndex, annotationsPerImage, undoStackPerImage]);

  const redo = useCallback(() => {
    if (currentIndex === -1) return;
    const rStack = redoStackPerImage[currentIndex] || [];
    if (rStack.length === 0) return;

    const currentList = annotationsPerImage[currentIndex] || [];
    const nextSnapshot = rStack[rStack.length - 1];

    setUndoStackPerImage((prev) => ({
      ...prev,
      [currentIndex]: [...(prev[currentIndex] || []), JSON.parse(JSON.stringify(currentList))],
    }));

    setRedoStackPerImage((prev) => ({
      ...prev,
      [currentIndex]: rStack.slice(0, rStack.length - 1),
    }));

    setAnnotationsPerImage((prev) => ({
      ...prev,
      [currentIndex]: nextSnapshot,
    }));
  }, [currentIndex, annotationsPerImage, redoStackPerImage]);

  const clearAll = useCallback(() => {
    if (currentIndex === -1) return;
    const currentList = annotationsPerImage[currentIndex] || [];
    if (currentList.length === 0) return;
    pushHistory(currentIndex, currentList);

    setAnnotationsPerImage((prev) => ({
      ...prev,
      [currentIndex]: [],
    }));
    setSelectedAnnotationId(null);
  }, [currentIndex, annotationsPerImage, pushHistory]);

  const canUndo = (undoStackPerImage[currentIndex] || []).length > 0;
  const canRedo = (redoStackPerImage[currentIndex] || []).length > 0;

  return (
    <AppContext.Provider
      value={{
        images,
        currentIndex,
        annotationsPerImage,
        undoStackPerImage,
        redoStackPerImage,
        selectedAnnotationId,
        activeTool,
        stepCounter,
        groups,
        activeGroupId,
        pendingArrowTargetId,
        setPendingArrowTargetId,
        addImage,
        switchImage,
        switchImageById,
        removeImage,
        reorderImages,
        addAnnotation,
        updateAnnotation,
        deleteAnnotation,
        setSelectedAnnotationId,
        setActiveTool,
        setStepCounter,
        renumberStepBadges,
        recolorAllBadges,
        undo,
        redo,
        clearAll,
        createGroup,
        deleteGroup,
        setActiveGroupId,
        assignImageToGroup,
        moveImageBetweenGroups,
        removeImageFromGroup,
        reorderGroupImages,
        updateGroup,
        autoGroupImagesByName,
        canUndo,
        canRedo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = (): AppState => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
};
