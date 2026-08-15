import {StudyData} from "@/types/study"
import {getStats} from "./stats"
import {StreakData} from "./streak"


export function getBadges(
data:StudyData,
streak:StreakData
){


const stats=getStats(data)


return [

{
name:"První krok",
icon:"🚀",
done:stats.totalAchievements>=1
},


{
name:"Deset úspěchů",
icon:"🏆",
done:stats.totalAchievements>=10
},


{
name:"100 minut práce",
icon:"⏱️",
done:stats.minutes>=100
},


{
name:"První kapitola hotová",
icon:"📚",
done:stats.completedChapters>=1
},


{
name:"7 dní v řadě",
icon:"🔥",
done:streak.current>=7
}


]

}
