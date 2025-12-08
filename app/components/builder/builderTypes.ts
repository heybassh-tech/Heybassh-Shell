export type CustomFieldType = "text" | "textarea" | "image" | "number" | "boolean";

export interface CustomFieldDefinition {
  id: string;
  label: string;
  type: CustomFieldType;
  defaultValue?: string;
}

export interface ComponentInstance {
  id: string;
  name: string;
  html: string;
  css: string;
  js: string;
  fields: CustomFieldDefinition[];
  fieldValues: Record<string, string | number | boolean>;
}

export interface Column {
  id: string;
  width: number; // percentage width in the section row
  components: ComponentInstance[];
}

export interface Section {
  id: string;
  label: string;
  columns: Column[];
}

export interface BuilderState {
  sections: Section[];
}

export type PaletteComponentId = "hero" | "textBlock" | "imageLeftTextRight";








