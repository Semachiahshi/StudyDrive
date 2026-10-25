import { pickReadingWork, unpickReadingWork } from "@/app/(app)/actions";
import type { ReadingWorkRow } from "@/lib/data";
import {
  FORM_LABEL,
  LITERARY_PERIODS,
  MAX_PER_AUTHOR,
  PERIOD_LABEL,
  READING_LIST_SIZE,
  pickBlocker,
  summarizeReadingList,
} from "@/lib/domain/reading";
import { ActionButton } from "./forms";
import { Icon } from "./icon";
import { Card, Pill, ProgressBar, Section, cx } from "./ui";

/** Picking 20 works from the school's reading list; each pick becomes a topic of the track. */
export function ReadingList({ works }: { works: ReadingWorkRow[] }) {
  const picked = works.filter((w) => w.topic_id);
  const summary = summarizeReadingList(picked);
  const full = picked.length >= READING_LIST_SIZE;

  return (
    <Section
      title="Čtenářský deník"
      description={`Vyber ${READING_LIST_SIZE} děl ze seznamu školy. Každé vybrané dílo se přidá jako téma: Naučit = přečíst, Procvičit = rozbor, Zopakovat = zopakovat před zkouškou.`}
    >
      <Card className="mb-4 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-headline font-semibold">
            Vybráno <span className="tabular">{summary.count}</span> z {READING_LIST_SIZE}
          </p>
          {summary.complete ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-tint px-2 py-0.5 text-footnote font-semibold text-green">
              <Icon name="checkCircle" size={14} strokeWidth={2.2} />
              Splňuje kritéria
            </span>
          ) : (
            <span className="text-footnote text-label-2">Zatím nesplňuje kritéria</span>
          )}
        </div>
        <ProgressBar ratio={summary.count / READING_LIST_SIZE} label="Vybraná díla" />
        <ul className="mt-3 space-y-1 text-footnote">
          {summary.periods.map((p) => (
            <Criterion key={p.key} label={PERIOD_LABEL[p.key]} count={p.count} min={p.min} />
          ))}
          {summary.forms.map((f) => (
            <Criterion key={f.key} label={`Druh: ${FORM_LABEL[f.key]}`} count={f.count} min={f.min} />
          ))}
        </ul>
        <p className="mt-3 text-caption text-label-2">
          Nejvýše {MAX_PER_AUTHOR} díla od jednoho autora. Seznam odevzdej řediteli školy do 31. března.
        </p>
      </Card>

      {LITERARY_PERIODS.map((period) => {
        const group = works.filter((w) => w.period === period);
        if (group.length === 0) return null;
        const pickedHere = group.filter((w) => w.topic_id).length;
        return (
          <details key={period} className="mb-3" open={!full}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-1 py-2">
              <span className="text-subheadline font-semibold">{PERIOD_LABEL[period]}</span>
              <span className="tabular text-footnote text-label-2">
                {pickedHere} vybráno · {group.length} děl
              </span>
            </summary>
            <Card className="overflow-hidden">
              <ul className="divide-y divide-separator">
                {group.map((work) => {
                  const blocker = work.topic_id || full ? null : pickBlocker(picked, work);
                  return (
                    <li key={work.id} className={cx("flex min-h-[52px] items-center gap-3 px-4 py-2.5", work.topic_id && "bg-fill")}>
                      <div className="min-w-0 flex-1">
                        <p className="text-subheadline">
                          {work.topic_id && <Icon name="check" size={15} strokeWidth={2.4} className="mr-1 inline text-green" />}
                          <span className="text-label-2">{work.author}:</span> {work.title}
                        </p>
                        {blocker && <p className="text-caption text-label-3">{blocker}</p>}
                      </div>
                      <Pill>{FORM_LABEL[work.form]}</Pill>
                      {work.topic_id ? (
                        <ActionButton action={unpickReadingWork} fields={{ id: work.id }} variant="gray" size="sm">
                          Odebrat
                        </ActionButton>
                      ) : (
                        !full &&
                        !blocker && (
                          <ActionButton action={pickReadingWork} fields={{ id: work.id }} variant="tinted" size="sm" icon="plus">
                            Vybrat
                          </ActionButton>
                        )
                      )}
                    </li>
                  );
                })}
              </ul>
            </Card>
          </details>
        );
      })}
    </Section>
  );
}

function Criterion({ label, count, min }: { label: string; count: number; min: number }) {
  const met = count >= min;
  return (
    <li className="tabular flex items-center justify-between gap-3">
      <span className="flex min-w-0 items-center gap-1.5 text-label-2">
        <Icon name={met ? "checkCircle" : "circle"} size={14} className={met ? "shrink-0 text-green" : "shrink-0 text-label-3"} />
        {label}
      </span>
      <strong className={met ? undefined : "text-label-2"}>
        {count} / min. {min}
      </strong>
    </li>
  );
}
