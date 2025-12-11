import type { ComponentInstance, CustomFieldDefinition } from "./builderTypes";

function replaceFieldsInHtml(html: string, fieldValues: ComponentInstance["fieldValues"]) {
  return html.replace(/{{\s*([\w-]+)\s*}}/g, (_, key: string) => {
    const value = fieldValues[key];
    if (value === undefined || value === null) return "";
    return String(value);
  });
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: CustomFieldDefinition;
  value: string | number | boolean | undefined;
  onChange: (val: string | number | boolean) => void;
}) {
  const common =
    "w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

  const toStringValue = (v: unknown): string =>
    v === undefined || v === null ? "" : String(v);

  const toNumberOrEmpty = (v: unknown): number | "" => {
    if (typeof v === "number") return v;
    if (v === undefined || v === null || v === "") return "";
    const parsed = Number(v);
    return Number.isNaN(parsed) ? "" : parsed;
  };

  switch (field.type) {
    case "textarea":
      return (
        <textarea
          className={`${common} min-h-[64px] resize-y`}
          value={toStringValue(value)}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "number":
      return (
        <input
          type="number"
          className={common}
          value={toNumberOrEmpty(value)}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      );
    case "boolean":
      return (
        <input
          type="checkbox"
          className="h-3 w-3 rounded border-slate-300 text-slate-900"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
      );
    case "image":
    case "text":
    default:
      return (
        <input
          type="text"
          className={common}
          value={toStringValue(value)}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

export function ComponentEditor({
  component,
  onChange,
}: {
  component: ComponentInstance | null;
  onChange: (next: ComponentInstance) => void;
}) {
  if (!component) {
    return (
      <aside className="flex h-full flex-col items-center justify-center border-l border-slate-200 bg-slate-50/40 px-6 text-center text-xs text-slate-500">
        <p className="font-medium text-slate-600">Select a component to edit</p>
        <p className="mt-1 max-w-[200px]">
          Click a component in the canvas to edit its HTML, CSS, JS, and custom fields.
        </p>
      </aside>
    );
  }

  const htmlWithFields = replaceFieldsInHtml(component.html, component.fieldValues);

  const updateFieldValue = (fieldId: string, value: string | number | boolean) => {
    onChange({
      ...component,
      fieldValues: {
        ...component.fieldValues,
        [fieldId]: value,
      },
    });
  };

  const updateFieldDef = (idx: number, patch: Partial<CustomFieldDefinition>) => {
    const nextFields = [...component.fields];
    nextFields[idx] = { ...nextFields[idx], ...patch };
    onChange({
      ...component,
      fields: nextFields,
    });
  };

  const addField = () => {
    const nextFields: CustomFieldDefinition[] = [
      ...component.fields,
      {
        id: `field_${component.fields.length + 1}`,
        label: "New field",
        type: "text",
        defaultValue: "",
      },
    ];
    onChange({ ...component, fields: nextFields });
  };

  const removeField = (idx: number) => {
    const nextFields = component.fields.filter((_, i) => i !== idx);
    onChange({ ...component, fields: nextFields });
  };

  return (
    <aside className="flex h-full min-w-[320px] max-w-sm flex-col border-l border-slate-200 bg-slate-50/60">
      <header className="border-b border-slate-200 px-3 py-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Component
        </h2>
        <input
          className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-800 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          value={component.name}
          onChange={(e) => onChange({ ...component, name: e.target.value })}
        />
      </header>

      <div className="flex flex-1 flex-col gap-3 overflow-auto p-3 text-xs">
        <section className="space-y-1 rounded-md border border-slate-200 bg-white p-2">
          <header className="flex.items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Custom fields
            </span>
            <button
              type="button"
              onClick={addField}
              className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              Add field
            </button>
          </header>
          <div className="mt-2 space-y-2">
            {component.fields.map((field, idx) => (
              <div
                key={field.id ?? idx}
                className="rounded-md border border-slate-200 bg-slate-50/80 p-2"
              >
                <div className="mb-1 flex items-center gap-2">
                  <input
                    className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    value={field.label}
                    onChange={(e) => updateFieldDef(idx, { label: e.target.value })}
                  />
                  <select
                    className="w-[88px] rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[10px] text-slate-700 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    value={field.type}
                    onChange={(e) =>
                      updateFieldDef(idx, {
                        type: e.target.value as CustomFieldDefinition["type"],
                      })
                    }
                  >
                    <option value="text">Text</option>
                    <option value="textarea">Textarea</option>
                    <option value="image">Image URL</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeField(idx)}
                    className="rounded-full px-2 py-1 text-[10px] font-medium text-slate-500 hover:bg-slate-100"
                  >
                    Remove
                  </button>
                </div>
                <label className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  Value
                </label>
                <FieldInput
                  field={field}
                  value={component.fieldValues[field.id]}
                  onChange={(val) => updateFieldValue(field.id, val)}
                />
              </div>
            ))}
            {component.fields.length === 0 && (
              <p className="text-[11px] text-slate-500">
                No fields yet. Use <code className="rounded bg-slate-100 px-1">{"{{field_id}}"}</code>{" "}
                in your HTML template.
              </p>
            )}
          </div>
        </section>

        <section className="space-y-1 rounded-md border border-slate-200 bg-white p-2">
          <header>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              HTML
            </span>
          </header>
          <textarea
            className="mt-1 h-32 w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px] text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            value={component.html}
            onChange={(e) => onChange({ ...component, html: e.target.value })}
          />
        </section>

        <section className="space-y-1 rounded-md border border-slate-200 bg-white p-2">
          <header>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              CSS
            </span>
          </header>
          <textarea
            className="mt-1 h-24 w-full rounded-md border border-slate-200 bg-slate-50 px-2.py-1 font-mono text-[11px] text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            value={component.css}
            onChange={(e) => onChange({ ...component, css: e.target.value })}
          />
        </section>

        <section className="space-y-1 rounded-md border border-slate-200 bg-white p-2">
          <header>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              JavaScript
            </span>
          </header>
          <textarea
            className="mt-1 h-24 w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px] text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            value={component.js}
            onChange={(e) => onChange({ ...component, js: e.target.value })}
          />
          <p className="mt-1 text-[10px] text-slate-500">
            JS is stored with the component. You can decide later how to execute this safely in
            your runtime.
          </p>
        </section>

        <section className="space-y-1 rounded-md border border-dashed border-emerald-200 bg-emerald-25 p-2">
          <header>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
              Preview
            </span>
          </header>
          <div className="relative overflow-hidden rounded-md border border-slate-200 bg-white p-3">
            {component.css && (
              <style
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: component.css }}
              />
            )}
            <div
              className="builder-preview"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: htmlWithFields }}
            />
          </div>
        </section>
      </div>
    </aside>
  );
}










