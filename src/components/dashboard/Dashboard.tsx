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

removeGoal:(goalId:string)=>void

addActivity:()=>void

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
bg-gradient-to-br
from-slate-50
via-blue-50
to-indigo-100
dark:from-slate-950
dark:via-slate-900
dark:to-blue-950
p-4
md:p-8
">


<div className="
max-w-6xl
mx-auto
">


<DashboardHeader

dark={props.dark}

onTheme={props.toggleTheme}

onExport={props.exportFile}

onImport={props.importFile}

/>



<section className="
mb-8
">


<h1 className="
text-5xl
md:text-6xl
font-black
tracking-tight
">

🚀 StudyDrive

</h1>


<p className="
mt-3
text-slate-600
dark:text-slate-300
text-lg
">

Tvůj osobní systém pro učení a dosažení cílů.

</p>


</section>




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




<div className="
grid
md:grid-cols-2
gap-6
mt-6
">


<ProgressSection

progress={props.stats.averageProgress}

/>


<ActivitySection

activity={props.activity}

/>


</div>




<section className="
mt-6
">


<h2 className="
text-2xl
font-black
mb-4
">

🎯 Moje cíle

</h2>


<GoalList

goals={props.data.goals}

addChapter={props.addChapter}

addSubChapter={props.addSubChapter}

removeGoal={props.removeGoal}

addActivity={props.addActivity}

updateProgress={props.updateProgress}

removeNode={props.removeNode}

/>


</section>



<Achievements

badges={props.badges}

/>



</div>


</main>

)

}
