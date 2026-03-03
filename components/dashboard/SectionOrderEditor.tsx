'use client';

import { useMemo } from 'react';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SectionKey } from '@/lib/config/types';
import { SECTION_LABELS } from '@/components/site/WeddingContent';

function SortableItem({ id }: { id: SectionKey }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <li ref={setNodeRef} style={style} className="flex cursor-grab items-center justify-between rounded-xl border border-black/10 bg-white/70 px-3 py-2" {...attributes} {...listeners}>
      <span>{SECTION_LABELS[id]}</span>
      <span className="text-xs tracking-[0.2em] text-[#6f6561]">DRAG</span>
    </li>
  );
}

export function SectionOrderEditor({
  order,
  onChange
}: {
  order: SectionKey[];
  onChange: (next: SectionKey[]) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor));
  const items = useMemo(() => order, [order]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = items.indexOf(active.id as SectionKey);
        const newIndex = items.indexOf(over.id as SectionKey);
        onChange(arrayMove(items, oldIndex, newIndex));
      }}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {items.map((id) => (
            <SortableItem key={id} id={id} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
