// Rules for the Czech oral exam reading list ("čtenářský deník"): the student
// picks 20 works from the school's list, with minimum counts per period and
// literary form and at most two works by one author.

export const LITERARY_PERIODS = ["before_1800", "century_19", "world_modern", "czech_modern"] as const;
export type LiteraryPeriod = (typeof LITERARY_PERIODS)[number];

export const LITERARY_FORMS = ["prose", "poetry", "drama"] as const;
export type LiteraryForm = (typeof LITERARY_FORMS)[number];

export const PERIOD_LABEL: Record<LiteraryPeriod, string> = {
  before_1800: "Světová a česká literatura do konce 18. století",
  century_19: "Světová a česká literatura 19. století",
  world_modern: "Světová literatura 20. a 21. století",
  czech_modern: "Česká literatura 20. a 21. století",
};

export const FORM_LABEL: Record<LiteraryForm, string> = {
  prose: "próza",
  poetry: "poezie",
  drama: "drama",
};

export const READING_LIST_SIZE = 20;
export const MAX_PER_AUTHOR = 2;
export const PERIOD_MIN: Record<LiteraryPeriod, number> = {
  before_1800: 2,
  century_19: 3,
  world_modern: 4,
  czech_modern: 5,
};
export const FORM_MIN: Record<LiteraryForm, number> = { prose: 2, poetry: 2, drama: 2 };

export type ReadingWork = {
  id: string;
  author_key: string;
  period: LiteraryPeriod;
  form: LiteraryForm;
};

type Count<K> = { key: K; count: number; min: number };

export type ReadingListSummary = {
  count: number;
  periods: Count<LiteraryPeriod>[];
  forms: Count<LiteraryForm>[];
  /** Author keys with more than the allowed number of works (only after manual edits). */
  overAuthors: string[];
  complete: boolean;
};

function tally<K extends string>(keys: readonly K[], values: K[], min: Record<K, number>): Count<K>[] {
  return keys.map((key) => ({ key, count: values.filter((v) => v === key).length, min: min[key] }));
}

function missing<K>(counts: Count<K>[]): number {
  return counts.reduce((sum, c) => sum + Math.max(0, c.min - c.count), 0);
}

export function summarizeReadingList(picked: ReadingWork[]): ReadingListSummary {
  const periods = tally(LITERARY_PERIODS, picked.map((w) => w.period), PERIOD_MIN);
  const forms = tally(LITERARY_FORMS, picked.map((w) => w.form), FORM_MIN);
  const perAuthor = new Map<string, number>();
  for (const w of picked) perAuthor.set(w.author_key, (perAuthor.get(w.author_key) ?? 0) + 1);
  const overAuthors = [...perAuthor].filter(([, n]) => n > MAX_PER_AUTHOR).map(([a]) => a);
  return {
    count: picked.length,
    periods,
    forms,
    overAuthors,
    complete: picked.length === READING_LIST_SIZE && missing(periods) === 0 && missing(forms) === 0 && overAuthors.length === 0,
  };
}

/**
 * Why `work` cannot be picked next, or null when it can. Besides the hard limits
 * (20 works, two per author) a pick is refused when the slots left afterwards
 * could no longer cover the minimums still missing.
 */
export function pickBlocker(picked: ReadingWork[], work: ReadingWork): string | null {
  if (picked.some((w) => w.id === work.id)) return null;
  if (picked.length >= READING_LIST_SIZE) return `Už máš vybraných ${READING_LIST_SIZE} děl.`;
  if (picked.filter((w) => w.author_key === work.author_key).length >= MAX_PER_AUTHOR) {
    return `Od jednoho autora můžeš mít nejvýše ${MAX_PER_AUTHOR} díla.`;
  }
  const after = summarizeReadingList([...picked, work]);
  const slotsLeft = READING_LIST_SIZE - after.count;
  const periodGap = after.periods.filter((p) => p.count < p.min);
  if (missing(after.periods) > slotsLeft) {
    return `Zbylá místa potřebuješ na: ${periodGap.map((p) => PERIOD_LABEL[p.key].toLowerCase()).join("; ")}.`;
  }
  const formGap = after.forms.filter((f) => f.count < f.min);
  if (missing(after.forms) > slotsLeft) {
    return `Zbylá místa potřebuješ na: ${formGap.map((f) => FORM_LABEL[f.key]).join(", ")}.`;
  }
  return null;
}

/** Outline placed in a picked work's topic notes, to be filled in as the analysis. */
export const ANALYSIS_OUTLINE = `Rozbor díla

1. Analýza uměleckého textu
– téma a motivy
– časoprostor
– kompoziční výstavba
– literární druh a žánr
– vypravěč / lyrický subjekt
– postavy
– vyprávěcí způsoby, typy promluv
– veršová výstavba (u poezie)
– jazykové prostředky, tropy a figury

2. Literárněhistorický kontext
– autor a jeho další tvorba
– literární směr a doba vzniku

3. Moje poznámky
`;
