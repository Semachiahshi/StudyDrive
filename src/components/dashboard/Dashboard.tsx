"use client"

import StatsCards from "@/components/dashboard/StatsCards"
import DashboardHeader from "@/components/dashboard/DashboardHeader"
import ProgressSection from "@/components/dashboard/ProgressSection"
import ActivitySection from "@/components/dashboard/ActivitySection"
import Achievements from "@/components/dashboard/Achievements"
import GoalList from "@/components/goals/GoalList"
import NewGoal from "@/components/goals/NewGoal"

import {StudyData} from "@/types/study"

import {
DashboardStats,
DashboardBadge,
DashboardActivity,
DashboardStreak
} from "@/types/dashboard"


type Props={

data:StudyData

stats:DashboardStats

badges:DashboardBadge[]

activity:DashboardActivity

streak:DashboardStreak

dark:boolean

toggleTheme:()=>void

exportFile:()=>void

importFile:(e:React.ChangeEvent<HTMLInputElement>)=>void

addChapter:(goalId:string,name:string)=>void

addSubChapter:(goalId:string,nodeId:string,name:string)=>void

updateProgress:(goalId:string,nodeId:string)=>void

removeNode:(goalId:string,nodeId:string)=>void

goal:string

setGoal:(value:string)=>void

addGoal:(name:string)=>void

}



export default function Dashboard(props:Props){

return (

<main className="
min-h-screen
bg-slate-100
dark:bg-slate-950
p-6
">


<DashboardHeader

dark={props.dark}

onTheme={props.toggleTheme}

onExport={props.exportFile}

onImport={props.importFile}

/>



<div className="max-w-5xl mx-auto">


<h1 className="text-4xl font-black mb-2">

🚀 StudyDrive

</h1>



<NewGoal

goal={props.goal}

setGoal={props.setGoal}

addGoal={props.addGoal}

/>



<StatsCards

minutes={props.stats.minutes}

chapters={props.stats.completedChapters}

streak={props.streak.current}

achievements={props.stats.totalAchievements}

/>







<ProgressSection

progress={props.stats.averageProgress}

/>



<ActivitySection

activity={props.activity}

/>



<GoalList

goals={props.data.goals}

addChapter={props.addChapter}

addSubChapter={props.addSubChapter}

updateProgress={props.updateProgress}

removeNode={props.removeNode}

/>



<Achievements

badges={props.badges}

/>



</div>


</main>

)

}
