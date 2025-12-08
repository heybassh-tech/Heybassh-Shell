import type { BuilderState, Column, ComponentInstance, Section, PaletteComponentId } from "./builderTypes";
import { createId } from "./id";
import { createInstanceFromPalette } from "./palette";

type DragPayload =
  | { kind: "palette"; id: PaletteComponentId }
  | { kind: "existing"; sectionId: string; columnId: string; componentId: string };

function parseDragData(e: React.DragEvent): DragPayload | null {
  try {
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return null;
    return JSON.parse(raw) as DragPayload;
  } catch {
    return null;
  }
}

export interface BuilderCanvasProps {
  state: BuilderState;
  onChange: (state: BuilderState) => void;
  selectedComponentId: string | null;
  onSelectComponent: (cmp: ComponentInstance | null) => void;
}

export function createInitialState(): BuilderState {
  return {
    sections: [
      {
        id: createId("section"),
        label: "Section 1",
        columns: [
          { id: createId("col"), width: 50, components: [] },
          { id: createId("col"), width: 50, components: [] },
        ],
      },
    ],
  };
}

export function getComponentById(state: BuilderState, id: string | null): ComponentInstance | null {
  if (!id) return null;
  for (const section of state.sections) {
    for (const column of section.columns) {
      for (const component of column.components) {
        if (component.id === id) return component;
      }
    }
  }
  return null;
}

export function BuilderCanvas({
  state,
  onChange,
  selectedComponentId,
  onSelectComponent,
}: BuilderCanvasProps) {
  const addSection = () => {
    const next: Section = {
      id: createId("section"),
      label: `Section ${state.sections.length + 1}`,
      columns: [{ id: createId("col"), width: 100, components: [] }],
    };
    onChange({ ...state, sections: [...state.sections, next] });
  };

  const removeSection = (sectionId: string) => {
    onChange({
      ...state,
      sections: state.sections.filter((s) => s.id !== sectionId),
    });
    if (selectedComponentId) {
      const stillExists = getComponentById(
        { ...state, sections: state.sections.filter((s) => s.id !== sectionId) },
        selectedComponentId,
      );
      if (!stillExists) {
        onSelectComponent(null);
      }
    }
  };

  const addColumn = (sectionId: string) => {
    const nextSections = state.sections.map((section) => {
      if (section.id !== sectionId) return section;
      const newCol: Column = {
        id: createId("col"),
        width: 100 / (section.columns.length + 1),
        components: [],
      };
      const nextCols = [...section.columns, newCol];
      const width = 100 / nextCols.length;
      return {
        ...section,
        columns: nextCols.map((c) => ({ ...c, width })),
      };
    });
    onChange({ ...state, sections: nextSections });
  };

  const removeColumn = (sectionId: string, columnId: string) => {
    const nextSections = state.sections.map((section) => {
      if (section.id !== sectionId) return section;
      const remaining = section.columns.filter((c) => c.id !== columnId);
      if (remaining.length === 0) {
        return section;
      }
      const width = 100 / remaining.length;
      return {
        ...section,
        columns: remaining.map((c) => ({ ...c, width })),
      };
    });
    const nextState: BuilderState = { ...state, sections: nextSections };
    onChange(nextState);
    if (selectedComponentId && !getComponentById(nextState, selectedComponentId)) {
      onSelectComponent(null);
    }
  };

  const handleDropOnColumn = (
    e: React.DragEvent<HTMLDivElement>,
    sectionId: string,
    columnId: string,
  ) => {
    e.preventDefault();
    const payload = parseDragData(e);
    if (!payload) return;

    if (payload.kind === "palette") {
      const instance = createInstanceFromPalette(payload.id);
      const nextSections = state.sections.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          columns: section.columns.map((col) =>
            col.id === columnId ? { ...col, components: [...col.components, instance] } : col,
          ),
        };
      });
      onChange({ ...state, sections: nextSections });
      onSelectComponent(instance);
    }
    // Moving existing components could be added here later if desired.
  };

  const handleRemoveComponent = (sectionId: string, columnId: string, componentId: string) => {
    const nextSections = state.sections.map((section) => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        columns: section.columns.map((col) =>
          col.id === columnId
            ? {
                ...col,
                components: col.components.filter((cmp) => cmp.id !== componentId),
              }
            : col,
        ),
      };
    });
    const nextState: BuilderState = { ...state, sections: nextSections };
    onChange(nextState);
    if (selectedComponentId === componentId) {
      onSelectComponent(null);
    }
  };

  return (
    <main className="flex h-full flex-1 flex-col gap-3 overflow-hidden bg-slate-100/60 p-3">
      <header className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
        <div className="flex flex-col">
          <h1 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Page builder
          </h1>
          <p className="text-[11px] text-slate-500">
            Build pages with sections, columns, and components. Drag components from the left panel.
          </p>
        </div>
        <button
          type="button"
          onClick={addSection}
          className="rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white shadow hover:bg-slate-800"
        >
          Add section
        </button>
      </header>

      <div className="relative flex-1 overflow-auto rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
        {state.sections.length === 0 && (
          <div className="flex h-full flex-col.items-center justify-center gap-2 text-xs text-slate-500">
            <p className="font-medium text-slate-600">No sections yet</p>
            <p className="max-w-xs text-center">
              Use the &quot;Add section&quot; button above, then drag components into the columns.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {state.sections.map((section, idx) => (
            <section
              key={section.id}
              className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-semibold text-white">
                    {idx + 1}
                  </span>
                  <input
                    className="w-40 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    value={section.label}
                    onChange={(e) => {
                      const nextSections = state.sections.map((s) =>
                        s.id === section.id ? { ...s, label: e.target.value } : s,
                      );
                      onChange({ ...state, sections: nextSections });
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => addColumn(section.id)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Add column
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSection(section.id)}
                    className="rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-medium text-slate-500 hover:bg-slate-100"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-12">
                {section.columns.map((col) => (
                  <div
                    key={col.id}
                    className="min-h-[120px] rounded-md border border-dashed border-slate-300 bg-slate-50/80 p-2"
                    style={{
                      gridColumn: `span ${Math.max(
                        3,
                        Math.min(12, Math.round((col.width / 100) * 12)),
                      )} / span ${Math.max(
                        3,
                        Math.min(12, Math.round((col.width / 100) * 12)),
                      )}`,
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDropOnColumn(e, section.id, col.id)}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2 text-[10px] text-slate-500">
                      <span>Column</span>
                      <button
                        type="button"
                        onClick={() => removeColumn(section.id, col.id)}
                        className="rounded-full px-2 py-0.5 hover:bg-slate-100"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="flex flex-col gap-1">
                      {col.components.map((cmp) => (
                        <div
                          key={cmp.id}
                          onClick={() =>
                            onSelectComponent(selectedComponentId === cmp.id ? null : cmp)
                          }
                          className={`group flex flex-col items-stretch gap-1 rounded-md border bg-white px-2 py-1 text-left text-[11px] shadow-sm transition cursor-pointer ${
                            selectedComponentId === cmp.id
                              ? "border-slate-900 ring-1 ring-slate-900/60"
                              : "border-slate-200 hover:border-slate-400"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-slate-700">
                              {cmp.name || "Component"}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveComponent(section.id, col.id, cmp.id);
                              }}
                              className="rounded-full px-2 py-0.5 text-[10px] text-slate-500 hover:bg-slate-100"
                            >
                              Remove
                            </button>
                          </div>
                          <p className="line-clamp-2 text-[10px] text-slate-500">
                            {cmp.html.replace(/\s+/g, " ").slice(0, 120)}
                          </p>
                        </div>
                      ))}
                      {col.components.length === 0 && (
                        <p className="mt-4 text-center text-[10px] text-slate-400">
                          Drag a component here
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}






