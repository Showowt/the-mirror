// ═══════════════════════════════════════════════════════════════
// THE MIRROR v2 — TYPES — BILINGUAL
// ═══════════════════════════════════════════════════════════════

export type Lang = "en" | "es";

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
  lang?: Lang;
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

export interface Translations {
  // Landing
  title: string;
  tagline: string;
  tagSub: string;
  beginDescent: string;
  theVault: string;
  cards: string;
  card: string;

  // Input
  promptL1: string;
  promptL1Sub: string;
  placeholder: string;
  submitBtn: string;
  sayMore: string;

  // Processing
  procL1: string[];
  procL2: string[];
  procL3: string[];
  procCard: string[];

  // Question
  answerThis: string;
  thatsEnough: string;
  levelLabel: string;
  level1: string;
  level2: string;
  level3: string;

  // Answer
  questionWas: string;
  answerIt: string;
  answerPlaceholder: string;
  goDeeper: string;

  // Observation
  mirrorSees: string;

  // Deeper
  completeDescent: string;

  // Card
  mirrorCard: string;
  cutDeepest: string;
  patternRevealed: string;
  stillUnseen: string;
  newDescent: string;
  openVault: string;
  credit: string;

  // Vault
  vaultTitle: string;
  descents: string;
  descent: string;
  patterns: string;
  pattern: string;
  identified: string;
  noDescents: string;
  back: string;
  clearVault: string;
  startOver: string;
  vaultCredit: string;

  // Crisis
  crisisText: string;
  crisisLine: string;
  crisisAction: string;

  // Voice
  micListening: string;
  micTap: string;
  voiceNotSupported: string;
}
