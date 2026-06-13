import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";

interface SortableItemProps {
  id: string;
  children: (handleProps: { listeners: any; attributes: any }) => ReactNode;
}

function SortableItem({ id, children }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : "auto",
  } as const;

  return (
    <div ref={setNodeRef} style={style as any}>
      {children({ listeners, attributes })}
    </div>
  );
}

interface SortableSlideListProps<T> {
  items: T[];
  getId: (item: T, index: number) => string;
  onReorder: (next: T[]) => void;
  renderItem: (
    item: T,
    index: number,
    handle: ReactNode,
  ) => ReactNode;
}

export function SortableSlideList<T>({
  items,
  getId,
  onReorder,
  renderItem,
}: SortableSlideListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = items.map((it, i) => getId(it, i));
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(items, oldIndex, newIndex));
  };

  const ids = items.map((it, i) => getId(it, i));

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ol className="space-y-3">
          {items.map((item, index) => {
            const id = getId(item, index);
            return (
              <SortableItem key={id} id={id}>
                {({ listeners, attributes }) => (
                  <li className="list-none">
                    {renderItem(
                      item,
                      index,
                      <button
                        {...listeners}
                        {...attributes}
                        type="button"
                        className="cursor-grab touch-none rounded-md border border-border bg-background p-1 text-muted-foreground hover:bg-accent active:cursor-grabbing"
                        aria-label="Drag to reorder"
                      >
                        <GripVertical className="h-3.5 w-3.5" />
                      </button>,
                    )}
                  </li>
                )}
              </SortableItem>
            );
          })}
        </ol>
      </SortableContext>
    </DndContext>
  );
}
