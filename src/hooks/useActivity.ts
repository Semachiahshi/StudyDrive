import {useState} from "react"

import {
loadActivity,
addActivity
} from "@/lib/activity"

import {
loadStreak,
updateStreak
} from "@/lib/streak"


export function useActivity(){

const [activity,setActivity]=useState(
()=>loadActivity()
)

const [streak,setStreak]=useState(
()=>loadStreak()
)


function addStudyActivity(minutes:number){

addActivity(minutes)

setActivity(
loadActivity()
)

setStreak(
updateStreak()
)

}


return {
activity,
streak,
addStudyActivity
}

}
