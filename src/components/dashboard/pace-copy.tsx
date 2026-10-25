import { formatSteps } from "@/lib/domain/dates";
import { roundUpPace } from "@/lib/domain/pace";

function everyNDays(n: number): string {
  if (n <= 1) return "každý studijní den";
  if (n <= 4) return `každé ${n} studijní dny`;
  return `každých ${n} studijních dní`;
}

/** "aspoň 2 kroky za studijní den (≈ 12 týdně)" — rounded up so the need is never understated. */
export function paceText(perStudyDay: number | null, perWeek: number | null): string | null {
  const day = roundUpPace(perStudyDay);
  if (day === null || perStudyDay === null || perWeek === null) return null;
  const week = formatSteps(Math.ceil(perWeek));
  if (day < 1) {
    return `zhruba 1 krok ${everyNDays(Math.floor(1 / Math.max(perStudyDay, 0.001)))} (≈ ${week} týdně)`;
  }
  return `aspoň ${formatSteps(day)} za studijní den (≈ ${week} týdně)`;
}
