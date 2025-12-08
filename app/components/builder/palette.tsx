import type { PaletteComponentId, ComponentInstance } from "./builderTypes";
import { createId } from "./id";

const PALETTE: Array<{
  id: PaletteComponentId;
  name: string;
  description: string;
  preset: Omit<ComponentInstance, "id">;
}> = [
  {
    id: "hero",
    name: "Hero",
    description: "Large headline with subtitle and button.",
    preset: {
      name: "Hero",
      html: `<section class="px-8 py-16 bg-slate-900 text-white rounded-2xl">
  <h1 class="text-4xl font-bold mb-4">{{headline}}</h1>
  <p class="text-lg text-slate-200 mb-6 max-w-xl">{{subheadline}}</p>
  <a href="{{button_url}}" class="inline-flex items-center px-5 py-3 bg-white text-slate-900 rounded-full text-sm font-semibold">
    {{button_label}}
  </a>
</section>`,
      css: ``,
      js: ``,
      fields: [
        {
          id: "headline",
          label: "Headline",
          type: "text",
          defaultValue: "Welcome to our new page",
        },
        {
          id: "subheadline",
          label: "Subheadline",
          type: "textarea",
          defaultValue: "Use this hero to get attention and explain the main value quickly.",
        },
        {
          id: "button_label",
          label: "Button label",
          type: "text",
          defaultValue: "Get started",
        },
        {
          id: "button_url",
          label: "Button URL",
          type: "text",
          defaultValue: "#",
        },
      ],
      fieldValues: {},
    },
  },
  {
    id: "textBlock",
    name: "Text block",
    description: "Simple rich text content block.",
    preset: {
      name: "Text block",
      html: `<section class="prose max-w-none">
  <h2>{{title}}</h2>
  <p>{{body}}</p>
</section>`,
      css: ``,
      js: ``,
      fields: [
        {
          id: "title",
          label: "Title",
          type: "text",
          defaultValue: "Section title",
        },
        {
          id: "body",
          label: "Body",
          type: "textarea",
          defaultValue: "Use this block for paragraphs, descriptions, or any free-form copy.",
        },
      ],
      fieldValues: {},
    },
  },
  {
    id: "imageLeftTextRight",
    name: "Image & text",
    description: "Image on the left, copy on the right.",
    preset: {
      name: "Image & text",
      html: `<section class="grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)] items-center">
  <div>
    <img src="{{image_url}}" alt="{{image_alt}}" class="w-full rounded-xl object-cover" />
  </div>
  <div class="space-y-4">
    <h2 class="text-2xl font-semibold">{{title}}</h2>
    <p class="text-slate-600">{{body}}</p>
  </div>
</section>`,
      css: ``,
      js: ``,
      fields: [
        {
          id: "image_url",
          label: "Image URL",
          type: "image",
          defaultValue: "https://via.placeholder.com/800x500",
        },
        {
          id: "image_alt",
          label: "Image alt text",
          type: "text",
          defaultValue: "Placeholder",
        },
        {
          id: "title",
          label: "Title",
          type: "text",
          defaultValue: "Image & text section",
        },
        {
          id: "body",
          label: "Body",
          type: "textarea",
          defaultValue: "Describe the image and provide helpful context for visitors.",
        },
      ],
      fieldValues: {},
    },
  },
];

export function createInstanceFromPalette(id: PaletteComponentId): ComponentInstance {
  const def = PALETTE.find((item) => item.id === id);
  if (!def) {
    throw new Error(`Unknown palette component: ${id}`);
  }

  const fieldValues: ComponentInstance["fieldValues"] = {};
  for (const field of def.preset.fields) {
    if (field.defaultValue !== undefined) {
      fieldValues[field.id] = field.defaultValue;
    }
  }

  return {
    id: createId("cmp"),
    ...def.preset,
    fieldValues,
  };
}

export function Palette({
  onStartDrag,
  onAddClick,
}: {
  onStartDrag?: (id: PaletteComponentId) => void;
  onAddClick?: (id: PaletteComponentId) => void;
}) {
  return (
    <aside className="flex h-full flex-col gap-3 border-r border-slate-200 bg-slate-50/60 p-3">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Components
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Drag a component into a column, or click Add.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {PALETTE.map((item) => (
          <button
            key={item.id}
            type="button"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(
                "application/json",
                JSON.stringify({ kind: "palette", id: item.id }),
              );
              onStartDrag?.(item.id);
            }}
            onClick={() => onAddClick?.(item.id)}
            className="group flex flex-col items-start gap-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-xs shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
          >
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              {item.name}
            </span>
            <span className="text-[11px] text-slate-500">{item.description}</span>
            <span className="mt-1 text-[10px] font-medium text-slate-400">
              Drag to column
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}






