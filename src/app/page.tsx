"use client"

import {useState} from "react"

import {useDashboard} from "@/hooks/useDashboard"
import {useActivity} from "@/hooks/useActivity"
import {useTheme} from "@/hooks/useTheme"
import {useGoals} from "@/hooks/useGoals"
import {useBackup} from "@/hooks/useBackup"
import {useStudy} from "@/hooks/useStudy"

import Dashboard from "@/components/dashboard/Dashboard"


export default function Home(){


const [goal,setGoal]=useState("")


const {
data,
update
}=useStudy()


const {
activity,
streak,
addStudyActivity
}=useActivity()


const {
dark,
toggleTheme
}=useTheme()


const {
importFile,
exportFile
}=useBackup(
data,
update
)


const {
addGoal,
addChapter,
addSubChapter,
removeGoal,
progress:updateProgress,
remove:removeNode
}=useGoals(
data,
update
)


const {
stats,
badges
}=useDashboard(
data,
streak
)


return (

<Dashboard

data={data}

stats={stats}

badges={badges}

activity={activity}

streak={streak}

dark={dark}

toggleTheme={toggleTheme}

exportFile={exportFile}

importFile={importFile}

addChapter={addChapter}

addSubChapter={addSubChapter}

removeGoal={removeGoal}

addActivity={()=>{
addStudyActivity(5)
}}

updateProgress={updateProgress}

removeNode={removeNode}

goal={goal}

setGoal={setGoal}

addGoal={addGoal}

/>

)

}
