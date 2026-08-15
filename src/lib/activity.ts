export type ActivityDay={

date:string

minutes:number

}



const KEY="studydrive-activity"



export function addActivity(minutes:number){


if(typeof window==="undefined")
return



const saved=
localStorage.getItem(KEY)



const activities:ActivityDay[]=
saved
?
JSON.parse(saved)
:
[]



const today=
new Date()
.toISOString()
.slice(0,10)



const existing=
activities.find(
a=>a.date===today
)



if(existing){

existing.minutes+=minutes

}else{

activities.push({

date:today,

minutes

})

}



localStorage.setItem(
KEY,
JSON.stringify(activities)
)

}



export function loadActivity():ActivityDay[]{


if(typeof window==="undefined")
return []


const saved=
localStorage.getItem(KEY)


return saved
?
JSON.parse(saved)
:
[]

}
