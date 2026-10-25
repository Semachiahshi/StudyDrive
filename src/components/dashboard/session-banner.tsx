import { endSession, completeStep } from "@/app/(app)/actions";
import { ActionButton } from "@/components/forms";
import { Icon } from "@/components/icon";
import { STEP_LABEL, STEP_NOUN, type Step } from "@/lib/domain/steps";
import type { SessionRow } from "@/lib/data";

const timeFormatter = new Intl.DateTimeFormat("cs-CZ", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Prague" });

export function SessionBanner({ session }: { session: SessionRow }) {
  const step = session.step as Step | null;
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-card bg-accent-tint px-4 py-3">
      <span className="relative flex size-2.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60 motion-reduce:hidden" />
        <span className="relative inline-flex size-2.5 rounded-full bg-accent" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-subheadline font-semibold">
          Právě studuješ{session.topics ? `: ${session.topics.title}` : ""}
          {step ? ` · ${STEP_NOUN[step]}` : ""}
        </p>
        <p className="text-footnote text-label-2">
          <Icon name="clock" size={13} className="mr-1 inline align-[-2px]" />
          od {timeFormatter.format(new Date(session.started_at))} · dnešní den se už počítá do série
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {session.topic_id && step && (
          <ActionButton action={completeStep} fields={{ topic_id: session.topic_id, step }} variant="filled" size="sm" icon="check">
            {STEP_LABEL[step]} — hotovo
          </ActionButton>
        )}
        <ActionButton action={endSession} variant="gray" size="sm" icon="stop">
          Ukončit
        </ActionButton>
      </div>
    </div>
  );
}
