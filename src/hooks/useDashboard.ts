import {useMemo} from "react"
import {getStats} from "@/lib/stats"
import {getBadges} from "@/lib/achievements"
import {StudyData} from "@/types/study"

type StreakData={
current:number
best:number
last:string
}

export function useDashboard(
data:StudyData,
streak:StreakData
){

const stats=useMemo(
()=>getStats(data),
[data]
)


const badges=useMemo(
()=>getBadges(data,streak),
[data,streak]
)


return {
stats,
badges
}

}
