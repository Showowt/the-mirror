// ═══════════════════════════════════════════════════════════════
// THE MIRROR v2 — TYPES
// ═══════════════════════════════════════════════════════════════

export type Phase =
  | "landing"
  | "input"
  | "proc-l1"
  | "question"
  | "answer-input"
  | "proc-l2"
  | "observation"
  | "proc-l3"
  | "deeper"
  | "proc-card"
  | "card"
  | "vault";

export interface MirrorCard {
  id: string;
  date: string;
  pattern_name: string;
  core_question: string;
  pattern_revealed: string;
  still_unseen: string;
  situation_preview: string;
  question1: string;
  question2: string;
}

export interface Vault {
  cards: MirrorCard[];
}

export interface DescentState {
  situation: string;
  question1: string;
  answer: string;
  observation: string;
  question2: string;
}
