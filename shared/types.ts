export const FIELD_TYPES = ["text", "number", "date", "check", "choice", "barcode"] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export type Field = {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options: string[];
};

export type JobForm = {
  name: string;
  fields: Field[];
};

export type Cell = {
  id: string;
  label: string;
  type: FieldType;
  value: string;
};

export type Row = {
  id: string;
  at: string;
  cells: Cell[];
};

export type ClientMessage =
  | { type: "submit"; id: string; values: Record<string, string> }
  | { type: "form"; form: JobForm };

export type ServerMessage =
  | {
      type: "state";
      code: string;
      createdAt: string;
      form: JobForm;
      rows: Row[];
      receivers: number;
      senders: number;
    }
  | { type: "form"; form: JobForm }
  | { type: "row"; row: Row }
  | { type: "presence"; receivers: number; senders: number }
  | { type: "ack"; id: string }
  | { type: "expired" }
  | { type: "error"; message: string };
