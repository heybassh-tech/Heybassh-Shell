"use client"

import { useState } from "react"
import { Palette, createInstanceFromPalette } from "../../builder/palette"
import { BuilderCanvas, createInitialState, getComponentById } from "../../builder/BuilderCanvas"
import { ComponentEditor } from "../../builder/component-editor"
import type { BuilderState, ComponentInstance, PaletteComponentId } from "../../builder/builderTypes"
import { Pill } from "./Pill"

export function FrontOfficeWebsiteTab() {
  const [builderState, setBuilderState] = useState<BuilderState>(() => createInitialState())
  const [builderSelectedComponentId, setBuilderSelectedComponentId] = useState<string | null>(null)

  const builderSelectedComponent: ComponentInstance | null = getComponentById(builderState, builderSelectedComponentId)

  const handleBuilderSelectComponent = (cmp: ComponentInstance | null) => {
    setBuilderSelectedComponentId(cmp?.id ?? null)
  }

  const handleBuilderAddFromPalette = (id: PaletteComponentId) => {
    if (builderState.sections.length === 0) {
      const initial = createInitialState()
      setBuilderState(initial)
      const instance = createInstanceFromPalette(id as PaletteComponentId)
      const firstSection = initial.sections[0]
      const firstColumn = firstSection.columns[0]
      firstColumn.components.push(instance)
      setBuilderState({ ...initial })
      setBuilderSelectedComponentId(instance.id)
      return
    }

    const instance = createInstanceFromPalette(id as PaletteComponentId)
    const [firstSection, ...rest] = builderState.sections
    const [firstColumn, ...otherCols] = firstSection.columns
    const nextFirstColumn = {
      ...firstColumn,
      components: [...firstColumn.components, instance],
    }
    const nextSections: BuilderState["sections"] = [
      { ...firstSection, columns: [nextFirstColumn, ...otherCols] },
      ...rest,
    ]
    setBuilderState({ ...builderState, sections: nextSections })
    setBuilderSelectedComponentId(instance.id)
  }

  const handleBuilderUpdateSelectedComponent = (updated: ComponentInstance) => {
    setBuilderState((prev) => {
      const nextSections = prev.sections.map((section) => ({
        ...section,
        columns: section.columns.map((col) => ({
          ...col,
          components: col.components.map((cmp) => (cmp.id === updated.id ? updated : cmp)),
        })),
      }))
      return { ...prev, sections: nextSections }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-[#18aead]">Website Builder</h2>
          <p className="mt-1 text-xs text-blue-200/80">
            Drag-and-drop sections, columns, and components to design your front office website.
          </p>
        </div>
      </div>
      <div className="overflow-hidden rounded-[26px] border border-[#1a2446] bg-[#0c142a]">
        <div className="h-[640px] bg-slate-100 flex">
          <Palette onAddClick={handleBuilderAddFromPalette} />
          <BuilderCanvas
            state={builderState}
            onChange={setBuilderState}
            selectedComponentId={builderSelectedComponentId}
            onSelectComponent={handleBuilderSelectComponent}
          />
          <ComponentEditor
            component={builderSelectedComponent}
            onChange={handleBuilderUpdateSelectedComponent}
          />
        </div>
      </div>
    </div>
  )
}

