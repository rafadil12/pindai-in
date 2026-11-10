export type Row = {
  id: string;
  text: string;
  at: string;
};

export type ClientMessage = {
  type: "submit";
  id: string;
  text: string;
};

export type ServerMessage =
  | {
      type: "state";
      code: string;
      createdAt: string;
      rows: Row[];
      receivers: number;
      senders: number;
    }
  | { type: "row"; row: Row }
  | { type: "presence"; receivers: number; senders: number }
  | { type: "ack"; id: string }
  | { type: "error"; message: string };
