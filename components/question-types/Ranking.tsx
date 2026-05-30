"use client";

import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Question } from "@/lib/survey-types";
import { ContinueButton, QuestionShell } from "./_shared";

/**
 * Ranking por drag-and-drop. Arraste para ordenar; a resposta é a lista de
 * `value`s na ordem final (`string[]`). Touch-friendly (webview Instagram iOS).
 */

interface Item {
  id: string;
  label: string;
  value: string;
  emoji?: string;
}

function SortableRow({ item, position }: { item: Item; position: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={`flex min-h-[3.25rem] cursor-grab touch-none select-none items-center gap-3 rounded-2xl border px-4 py-3 text-left text-base font-semibold transition-shadow active:cursor-grabbing ${
        isDragging
          ? "border-primary bg-primary-100 text-primary-900 shadow-lg"
          : "border-border bg-muted text-foreground"
      }`}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
        {position}
      </span>
      {item.emoji && <span className="text-xl">{item.emoji}</span>}
      <span className="flex-1">{item.label}</span>
      <span aria-hidden className="text-muted-foreground">
        ⠿
      </span>
    </li>
  );
}

export function Ranking({
  question,
  value,
  error,
  onSubmit,
}: {
  question: Question;
  value?: string[];
  error?: string | null;
  onSubmit: (value: string[]) => void;
}) {
  const base: Item[] = [...(question.options ?? [])]
    .sort((a, b) => a.order - b.order)
    .map((o) => ({
      id: o.id,
      label: o.label,
      value: o.value ?? o.label,
      emoji: o.emoji,
    }));

  // Restaura ordem salva, se houver.
  const initial =
    value && value.length
      ? [...base].sort((a, b) => value.indexOf(a.value) - value.indexOf(b.value))
      : base;

  const [items, setItems] = useState<Item[]>(initial);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const from = prev.findIndex((i) => i.id === active.id);
      const to = prev.findIndex((i) => i.id === over.id);
      return arrayMove(prev, from, to);
    });
  };

  return (
    <QuestionShell question={question} error={error}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="flex flex-col gap-2">
            {items.map((item, idx) => (
              <SortableRow key={item.id} item={item} position={idx + 1} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <ContinueButton onClick={() => onSubmit(items.map((i) => i.value))} />
    </QuestionShell>
  );
}
