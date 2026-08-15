import { StudyData } from "@/types/study"

const KEY = "studydrive-data"

export function loadStudy(): StudyData {
  if (typeof window === "undefined") {
    return { goals: [] }
  }

  const saved = localStorage.getItem(KEY)

  if (!saved) {
    return { goals: [] }
  }

  return JSON.parse(saved)
}


export function saveStudy(data: StudyData) {
  localStorage.setItem(KEY, JSON.stringify(data))
}
