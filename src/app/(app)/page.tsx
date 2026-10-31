import type { Metadata } from "next";
import Link from "next/link";
import { startSession } from "./actions";
import { paceText } from "@/components/dashboard/pace-copy";
import { RouteTimeline } from "@/components/dashboard/route-timeline";
import { SessionBanner } from "@/components/dashboard/session-banner";
import { DismissibleSuggestion } from "@/components/dashboard/suggestion-card";
import { ActionButton } from "@/components/forms";
import { Icon } from "@/components/icon";
import {
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
  ProgressBar,
  ProgressRing,
  Section,
  StatusBadge,
  cx,
} from "@/components/ui";
import { loadModel } from "@/lib/data";
import {
  czPlural,
  daysBetween,
  formatDate,
  formatDateWindow,
  formatDays,
  formatSteps,
  formatTopics,
  formatWeekdayDate,
  relativeDays,
} from "@/lib/domain/dates";
import { PACE_LABEL } from "@/lib/domain/pace";
import { percent } from "@/lib/domain/progress";
import { STEP_LABEL, STEP_NOUN } from "@/lib/domain/steps";
import type { Model } from "@/lib/model";

export const metadata: Metadata = { title: "Přehled" };

export default async function OverviewPage() {
  const { data, model } = await loadModel();
  const capitalized = formatWeekdayDate(model.today).replace(/^./, (c) => c.toUpperCase());

  return (
    <>
      <PageHeader title="Přehled" subtitle={capitalized} />

      {data.activeSession && <SessionBanner session={data.activeSession} />}
      {model.overall.behind.length > 0 && <BehindWarning model={model} bufferDays={data.profile.buffer_days} />}
      {model.missing.noSubjects && <Onboarding />}

      <div className="hero-cards mb-8 grid grid-cols-1 gap-4 @xl:grid-cols-2 @4xl:grid-cols-3">
        <CountdownCard model={model} />
        <ProgressCard model={model} />
        <StreakCard model={model} hasActiveSession={!!data.activeSession} />
      </div>

      <PaceSection model={model} bufferDays={data.profile.buffer_days} studyDaysPerWeek={data.profile.study_days_per_week} />

      {model.suggestion && <SuggestionSection model={model} />}

      {model.upcoming.length > 0 && (
        <Section title="Cesta k maturitě" description="Nejbližší termíny, cíle přípravy a zkoušky.">
          <RouteTimeline today={model.today} events={model.upcoming} />
        </Section>
      )}

      {model.subjects.length > 0 && <SubjectsSection model={model} />}

      <div className="grid grid-cols-1 gap-x-4 @3xl:grid-cols-2">
        <UpcomingExams model={model} />
        <UpcomingAdmin model={model} />
      </div>

      <MissingInfo model={model} />
    </>
  );
}

// ---------------------------------------------------------------- warning

function BehindWarning({ model, bufferDays }: { model: Model; bufferDays: number }) {
  const worst = [...model.overall.behind].sort(
    (a, b) => (a.pace.daysToExam ?? Infinity) - (b.pace.daysToExam ?? Infinity),
  )[0];
  const p = worst.pace;
  const pace = paceText(p.perStudyDay, p.perWeek);
  const targetPassed = (p.daysToTarget ?? 0) <= 0;
  const s = model.suggestion;

  return (
    <div role="alert" className="mb-6 overflow-hidden rounded-card border border-red/30 bg-red-tint">
      <div className="flex items-start gap-3 p-4 sm:p-5">
        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-red text-white">
          <Icon name="warning" size={22} strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-headline font-bold text-red">
            {model.overall.behind.length === 1
              ? `${worst.title} je ve skluzu`
              : `${model.overall.behind.length} ${czPlural(model.overall.behind.length, ["okruh je", "okruhy jsou", "okruhů je"])} ve skluzu — nejnaléhavější: ${worst.title}`}
          </h2>
          <p className="mt-1 text-subheadline">
            {targetPassed
              ? `Cíl přípravy (${formatDays(bufferDays)} před zkouškou) už minul. Do zkoušky zbývá ${formatDays(Math.max(p.daysToExam ?? 0, 0))}`
              : `Do cíle přípravy zbývá ${formatDays(p.daysToTarget ?? 0)}`}{" "}
            a zbývá {formatSteps(p.remainingSteps)}.
            {!targetPassed && p.expectedDoneSteps !== null && p.deficitSteps !== null && (
              <>
                {" "}
                Podle rovnoměrného plánu mělo být hotovo {formatSteps(Math.floor(p.expectedDoneSteps))}, zatím je hotovo{" "}
                {Math.round(p.expectedDoneSteps - p.deficitSteps)}.
              </>
            )}
            {pace && <> Aby to vyšlo, potřebuješ {pace}.</>}
          </p>
          <p className="mt-1 text-footnote text-label-2">
            Skluz se dá dohnat — nejrychleji pravidelnými malými kroky. Začni jedním hned teď.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {s ? (
              <ActionButton action={startSession} fields={{ topic_id: s.topicId, step: s.step }} variant="filled" icon="play">
                {STEP_LABEL[s.step]}: {s.topicTitle}
              </ActionButton>
            ) : (
              <ButtonLink href={`/tracks/${worst.trackId}`} variant="filled">
                Otevřít okruh
              </ButtonLink>
            )}
            <ButtonLink href={`/tracks/${worst.trackId}`} variant="gray">
              Podrobnosti
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- onboarding

function Onboarding() {
  const steps = [
    { title: "Přidej předměty a okruhy zkoušek", text: "Např. český jazyk s didaktickým testem, slohovou prací a ústní zkouškou.", href: "/subjects" },
    { title: "Doplň termíny", text: "Data nebo okna zkoušek a administrativní termíny, třeba přihlášku.", href: "/calendar" },
    { title: "Přidej témata", text: "U každého tématu pak postupně označíš Naučit → Procvičit → Zopakovat.", href: "/subjects" },
  ];
  return (
    <Card className="mb-8 p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2 text-accent-text">
        <Icon name="route" size={20} />
        <span className="text-footnote font-semibold uppercase tracking-wide">Začínáme</span>
      </div>
      <h2 className="text-title-2 font-bold">Postav si cestu k maturitě</h2>
      <p className="mt-1 max-w-2xl text-subheadline text-label-2">
        StudyDrive je zatím prázdný — žádná témata, data ani postup. Jakmile doplníš předměty, termíny a témata, uvidíš tu,
        kolik práce zbývá a jestli ti tempo stačí.
      </p>
      <ol className="mt-5 grid grid-cols-1 gap-3 @2xl:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title}>
            <Link href={s.href} className="flex h-full gap-3 rounded-xl bg-surface-2 p-4 transition-colors hover:bg-fill">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent text-footnote font-bold text-on-accent">
                {i + 1}
              </span>
              <span>
                <span className="block text-subheadline font-semibold">{s.title}</span>
                <span className="mt-0.5 block text-footnote text-label-2">{s.text}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  );
}

// ---------------------------------------------------------------- hero cards

function CountdownCard({ model }: { model: Model }) {
  const next = model.nextExam;
  const last = model.lastExam;
  return (
    <Card className="flex flex-col p-5">
      <p className="text-footnote font-semibold text-label-2">Nejbližší zkouška</p>
      {next ? (
        <>
          <p className="mt-2 flex items-baseline gap-2">
            <span className="tabular text-[2.75rem] font-bold leading-none tracking-tight">
              {Math.max(daysBetween(model.today, next.date), 0)}
            </span>
            <span className="text-headline text-label-2">
              {formatDays(Math.max(daysBetween(model.today, next.date), 0)).split(" ")[1]}
            </span>
          </p>
          <Link href={next.href} className="mt-2 line-clamp-2 text-subheadline font-semibold hover:underline">
            {next.title}
          </Link>
          <p className="text-footnote text-label-2">
            {formatDateWindow(next.date, next.endDate)}
            {next.estimate ? " · předběžně" : ""}
          </p>
          {last && last.id !== next.id && (
            <p className="mt-auto pt-3 text-footnote text-label-2">
              Poslední zkouška {relativeDays(model.today, last.endDate ?? last.date)} ({formatDate(last.endDate ?? last.date)})
            </p>
          )}
        </>
      ) : (
        <>
          <p className="mt-2 text-title-3 font-semibold">Zatím bez termínu</p>
          <p className="mt-1 text-footnote text-label-2">
            Bez data zkoušky nejde spočítat, kolik času zbývá. Doplň datum nebo okno zkoušky u okruhu.
          </p>
          <div className="mt-auto pt-4">
            <ButtonLink href="/calendar" variant="tinted" size="sm" icon="calendar">
              Doplnit termíny
            </ButtonLink>
          </div>
        </>
      )}
    </Card>
  );
}

function ProgressCard({ model }: { model: Model }) {
  const p = model.progress;
  return (
    <Card className="flex items-center gap-5 p-5">
      <ProgressRing ratio={p.ratio} label="Celkový postup" size={112} stroke={11}>
        <span>
          <span className="tabular block text-title-2 font-bold">{percent(p.ratio)}</span>
          <span className="block text-caption text-label-2">hotovo</span>
        </span>
      </ProgressRing>
      <div className="min-w-0">
        <p className="text-footnote font-semibold text-label-2">Celkový postup</p>
        {p.topics > 0 ? (
          <>
            <p className="tabular mt-1 text-subheadline">
              <strong>{p.doneSteps}</strong> z {formatSteps(p.totalSteps)}
            </p>
            <p className="tabular text-footnote text-label-2">
              {p.completedTopics} z {formatTopics(p.topics)} kompletně
            </p>
            <p className="tabular mt-1 text-footnote text-label-2">Zbývá {formatSteps(p.remainingSteps)}</p>
          </>
        ) : (
          <p className="mt-1 text-footnote text-label-2">
            Zatím žádná témata. Postup se začne počítat, jakmile je přidáš.
          </p>
        )}
      </div>
    </Card>
  );
}

function StreakCard({ model, hasActiveSession }: { model: Model; hasActiveSession: boolean }) {
  const s = model.streak;
  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-center justify-between">
        <p className="text-footnote font-semibold text-label-2">Série</p>
        <span className={cx("inline-flex items-center gap-1 text-footnote font-semibold", s.studiedToday ? "text-green" : "text-label-2")}>
          <Icon name={s.studiedToday ? "checkCircle" : "circle"} size={14} />
          {s.studiedToday ? "Dnes zapsáno" : "Dnes zatím nic"}
        </span>
      </div>
      <p className="mt-2 flex items-baseline gap-2">
        <Icon name="flame" size={28} className={s.current > 0 ? "self-center text-orange" : "self-center text-label-3"} />
        <span className="tabular text-[2.75rem] font-bold leading-none tracking-tight">{s.current}</span>
        <span className="text-headline text-label-2">{formatDays(s.current).split(" ")[1]} v řadě</span>
      </p>
      <p className="mt-1 text-footnote text-label-2">
        {s.best > 0 ? `Nejdelší série: ${formatDays(s.best)}.` : "Den se počítá, když začneš studovat nebo dokončíš krok."}
      </p>
      <div className="mt-auto pt-4">
        {!hasActiveSession && (
          <ActionButton action={startSession} variant={s.studiedToday ? "tinted" : "filled"} size="sm" icon="play">
            Začít studovat
          </ActionButton>
        )}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------- pace

function PaceSection({ model, bufferDays, studyDaysPerWeek }: { model: Model; bufferDays: number; studyDaysPerWeek: number }) {
  const o = model.overall;
  const measured = model.allTracks.filter((t) => ["on_track", "at_risk", "behind"].includes(t.pace.state));
  const pace = paceText(o.perStudyDay, o.perWeek);

  let headline: string;
  let body: string;
  if (o.state === "empty") {
    headline = "Tempo zatím nejde spočítat";
    body = "Chybí předměty, okruhy zkoušek, témata i termíny. Žádný odhad radši neukazujeme, dokud nejsou data.";
  } else if (o.state === "incomplete") {
    headline = "Tempo zatím nejde spočítat";
    body = "K výpočtu je potřeba okruh, který má témata i datum zkoušky. Co chybí, najdeš níže.";
  } else if (o.state === "done") {
    headline = "Všechno je hotovo";
    body = "Všechna zadaná témata mají naučeno, procvičeno i zopakováno.";
  } else {
    headline =
      o.state === "on_track" ? "Tempo stačí" : o.state === "at_risk" ? "Tempo je těsně pod plánem" : "Tempo nestačí";
    body = `Zbývá ${formatSteps(o.remainingSteps)}${o.nearestTarget ? `, nejbližší cíl přípravy je ${relativeDays(model.today, o.nearestTarget)} (${formatDate(o.nearestTarget)})` : ""}.${pace ? ` Potřebné tempo: ${pace}.` : ""}`;
  }

  return (
    <Section title="Tempo">
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          {o.state !== "empty" && o.state !== "incomplete" && <StatusBadge state={o.state} estimate={o.isEstimate} />}
          <h3 className="text-headline font-semibold">{headline}</h3>
        </div>
        <p className="mt-1.5 max-w-3xl text-subheadline text-label-2">{body}</p>

        {measured.length > 0 && (
          <ul className="mt-4 divide-y divide-separator border-t border-separator">
            {measured.map((t) => (
              <li key={t.track.id}>
                <Link href={`/tracks/${t.track.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 hover:opacity-80">
                  <span className="w-full min-w-0 truncate text-subheadline font-medium @4xl:w-auto @4xl:flex-1">
                    {t.subject.code || t.subject.name} · {t.track.name}
                  </span>
                  <span className="tabular min-w-0 flex-1 text-footnote text-label-2 @4xl:flex-none">
                    zbývá {formatSteps(t.pace.remainingSteps)} · {paceText(t.pace.perStudyDay, t.pace.perWeek)}
                  </span>
                  <StatusBadge state={t.pace.state} estimate={t.pace.isEstimate} />
                </Link>
              </li>
            ))}
          </ul>
        )}

        <details className="group mt-4 rounded-xl bg-surface-2 px-4 py-3 text-footnote text-label-2">
          <summary className="cursor-pointer list-none font-semibold text-label marker:hidden">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="info" size={15} />
              Jak se tempo počítá
              <Icon name="chevronRight" size={13} className="transition-transform group-open:rotate-90" />
            </span>
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Každé téma má 3 kroky: Naučit, Procvičit, Zopakovat. Hotové je až po všech třech.</li>
            <li>
              Cíl: mít vše hotové {formatDays(bufferDays)} před prvním dnem zkoušky (u okna zkoušek se počítá od jeho začátku).
            </li>
            <li>
              Od začátku přípravy do cíle se kroky rozloží rovnoměrně. „{PACE_LABEL.on_track}“ = méně než 1 krok pod tímto plánem,
              „{PACE_LABEL.at_risk}“ = nejvýš týden pozadu, „{PACE_LABEL.behind}“ = víc než týden pozadu nebo cíl už minul.
            </li>
            <li>Potřebné tempo = zbývající kroky ÷ zbývající studijní dny ({studyDaysPerWeek} z 7 dní v týdnu).</li>
            <li>U předběžného data nebo jen okna zkoušek je výsledek označený jako odhad.</li>
          </ul>
          <Link href="/settings#tempo" className="mt-2 inline-block font-semibold text-accent-text">
            Upravit předpoklady
          </Link>
        </details>
      </Card>
    </Section>
  );
}

// ---------------------------------------------------------------- suggestion

function SuggestionSection({ model }: { model: Model }) {
  const s = model.suggestion!;
  const track = model.allTracks.find((t) => t.track.id === s.trackId)!;
  const reason = {
    behind: "Tenhle okruh je ve skluzu.",
    at_risk: "Tenhle okruh se blíží ke skluzu.",
    nearest: "Tenhle okruh má nejbližší cíl.",
    continue: "Navazuje na rozpracované téma.",
  }[s.reason];
  const weekly = model.allTracks.filter((t) => t.pace.perWeek && ["on_track", "at_risk", "behind"].includes(t.pace.state));

  return (
    <Section title="Návrh" description="Jen nezávazný tip — můžeš si vybrat cokoli jiného.">
      <DismissibleSuggestion today={model.today}>
        <Card className="p-5 pr-14">
          <div className="flex items-center gap-2 text-footnote font-semibold text-accent-text">
            <Icon name="sparkle" size={15} />
            Co dál
          </div>
          <p className="mt-1.5 text-headline font-semibold">
            {STEP_NOUN[s.step]}: {s.topicTitle}
          </p>
          <p className="text-footnote text-label-2">
            {track.subject.code || track.subject.name} · {track.track.name}. {reason}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ActionButton action={startSession} fields={{ topic_id: s.topicId, step: s.step }} variant="filled" size="sm" icon="play">
              Začít
            </ActionButton>
            <ButtonLink href={`/tracks/${s.trackId}`} variant="gray" size="sm">
              Vybrat jiné téma
            </ButtonLink>
          </div>
          {weekly.length > 0 && (
            <div className="mt-4 border-t border-separator pt-3">
              <p className="text-footnote font-semibold text-label-2">Orientační plán na tento týden</p>
              <ul className="mt-1.5 space-y-1">
                {weekly.map((t) => (
                  <li key={t.track.id} className="flex justify-between gap-3 text-footnote">
                    <span className="truncate">
                      {t.subject.code || t.subject.name} · {t.track.name}
                    </span>
                    <span className="tabular shrink-0 font-semibold">{formatSteps(Math.ceil(t.pace.perWeek ?? 0))}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </DismissibleSuggestion>
    </Section>
  );
}

// ---------------------------------------------------------------- subjects

function SubjectsSection({ model }: { model: Model }) {
  return (
    <Section
      title="Předměty"
      action={
        <Link href="/subjects" className="text-subheadline text-accent-text">
          Vše
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-4 @xl:grid-cols-2 @4xl:grid-cols-3">
        {model.subjects.map((s) => (
          <Link key={s.subject.id} href={`/subjects/${s.subject.id}`} className="group">
            <Card className="flex h-full flex-col p-4 transition-shadow group-hover:shadow-lg">
              <div className="flex items-center gap-3">
                <ProgressRing ratio={s.progress.ratio} size={52} stroke={6} color={s.color} label={`Postup: ${s.subject.name}`}>
                  <span className="tabular text-caption font-bold">{s.progress.ratio === null ? "–" : Math.round(s.progress.ratio * 100)}</span>
                </ProgressRing>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-headline font-semibold">{s.subject.name}</p>
                  <p className="text-footnote text-label-2">
                    {s.tracks.length === 0
                      ? "Bez okruhů zkoušek"
                      : `${s.tracks.length} ${s.tracks.length === 1 ? "okruh" : s.tracks.length < 5 ? "okruhy" : "okruhů"} · ${formatTopics(s.progress.topics)}`}
                  </p>
                </div>
              </div>
              {s.tracks.length > 0 && (
                <ul className="mt-3 space-y-2.5">
                  {s.tracks.map((t) => (
                    <li key={t.track.id}>
                      <div className="mb-1 flex items-center justify-between gap-2 text-footnote">
                        <span className="truncate">{t.track.name}</span>
                        <StatusBadge state={t.pace.state} estimate={t.pace.isEstimate} />
                      </div>
                      <ProgressBar ratio={t.progress.ratio} color={s.color} label={`Postup: ${t.track.name}`} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------- upcoming

function UpcomingExams({ model }: { model: Model }) {
  return (
    <Section title="Zkoušky">
      {model.upcomingExams.length === 0 ? (
        <EmptyState icon="calendar" title="Žádné zkoušky v kalendáři" compact action={<ButtonLink href="/calendar" variant="tinted" size="sm">Otevřít kalendář</ButtonLink>}>
          Datum nebo okno zkoušky se zadává u každého okruhu.
        </EmptyState>
      ) : (
        <Card className="divide-y divide-separator overflow-hidden">
          {model.upcomingExams.slice(0, 5).map((e) => (
            <Link key={e.id} href={e.href} className="flex items-center gap-3 px-4 py-3 hover:bg-fill">
              <div className="min-w-0 flex-1">
                <p className="truncate text-subheadline font-medium">{e.title}</p>
                <p className="text-footnote text-label-2">
                  {formatDateWindow(e.date, e.endDate)}
                  {e.estimate ? " · předběžně" : ""}
                </p>
              </div>
              <span className="tabular shrink-0 text-footnote font-semibold">{relativeDays(model.today, e.date)}</span>
            </Link>
          ))}
        </Card>
      )}
    </Section>
  );
}

function UpcomingAdmin({ model }: { model: Model }) {
  return (
    <Section title="Administrativa">
      {model.upcomingAdmin.length === 0 ? (
        <EmptyState icon="doc" title="Žádné administrativní termíny" compact action={<ButtonLink href="/calendar" variant="tinted" size="sm">Přidat termín</ButtonLink>}>
          Například přihláška k maturitě nebo odevzdání seznamu četby.
        </EmptyState>
      ) : (
        <Card className="divide-y divide-separator overflow-hidden">
          {model.upcomingAdmin.slice(0, 5).map((e) => {
            const d = daysBetween(model.today, e.date);
            return (
              <Link key={e.id} href={e.href} className="flex items-center gap-3 px-4 py-3 hover:bg-fill">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-subheadline font-medium">{e.title}</p>
                  <p className="text-footnote text-label-2">do {formatDate(e.date)}</p>
                </div>
                <span className={cx("tabular shrink-0 text-footnote font-semibold", d <= 7 && "text-orange")}>
                  {relativeDays(model.today, e.date)}
                </span>
              </Link>
            );
          })}
        </Card>
      )}
    </Section>
  );
}

// ---------------------------------------------------------------- missing information

function MissingInfo({ model }: { model: Model }) {
  const m = model.missing;
  if (m.noSubjects) return null;
  const items = [
    ...m.subjectsWithoutTracks.map((s) => ({ key: `s${s.id}`, text: `${s.name}: přidej okruh zkoušky`, href: `/subjects/${s.id}` })),
    ...m.tracksWithoutTopics.map((t) => ({ key: `t${t.id}`, text: `${t.title}: chybí témata`, href: `/tracks/${t.id}` })),
    ...m.tracksWithoutDate.map((t) => ({ key: `d${t.id}`, text: `${t.title}: chybí datum zkoušky`, href: `/tracks/${t.id}` })),
  ];
  if (items.length === 0) return null;
  return (
    <Section title="Co ještě chybí" description="Bez těchto údajů nejde spočítat postup nebo tempo.">
      <Card className="divide-y divide-separator overflow-hidden">
        {items.map((i) => (
          <Link key={i.key} href={i.href} className="flex items-center gap-3 px-4 py-3 text-subheadline hover:bg-fill">
            <Icon name="info" size={18} className="shrink-0 text-label-2" />
            <span className="min-w-0 flex-1">{i.text}</span>
            <Icon name="chevronRight" size={16} className="text-label-3" />
          </Link>
        ))}
      </Card>
    </Section>
  );
}
