"use client"

import {useMemo,useState} from "react"
import {ActivityDay} from "@/lib/activity"


type Props={
data:ActivityDay[]
}


export default function ActivityCalendar({
data
}:Props){


const [today]=useState(
()=>new Date()
)


const days=useMemo(()=>{


const result=[]


for(let i=83;i>=0;i--){


const date=
new Date(
today.getTime()-i*86400000
)
.toISOString()
.slice(0,10)



const activity=
data.find(
item=>item.date===date
)



result.push({

date,

minutes:
activity?.minutes ?? 0

})


}


return result


},[data,today])



return (

<div className="
grid
grid-cols-12
gap-1
">


{

days.map(day=>(


<div

key={day.date}

title={`${day.date}: ${day.minutes} minut`}

className={`
h-4
w-4
rounded-sm
border
${
day.minutes===0
?
"bg-slate-200"
:
day.minutes<30
?
"bg-green-200"
:
day.minutes<60
?
"bg-green-400"
:
"bg-green-700"
}
`}

/>


))

}


</div>

)

}
