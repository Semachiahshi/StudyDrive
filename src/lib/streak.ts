export type StreakData={

last:string

current:number

best:number

}


const KEY="studydrive-streak"



const emptyStreak:StreakData={
last:"",
current:0,
best:0
}



export function updateStreak():StreakData{


if(typeof window==="undefined")
return emptyStreak



const today=
new Date()
.toISOString()
.slice(0,10)



const saved=
localStorage.getItem(KEY)



const data:StreakData=saved
?
JSON.parse(saved)
:
{
last:"",
current:0,
best:0
}



if(data.last===today)
return data



const yesterday=
new Date(
Date.now()-86400000
)
.toISOString()
.slice(0,10)



const updated={
...data
}



if(data.last===yesterday){

updated.current++

}else{

updated.current=1

}



updated.last=today



if(updated.current>updated.best){

updated.best=updated.current

}



localStorage.setItem(
KEY,
JSON.stringify(updated)
)



return updated

}




export function loadStreak():StreakData{


if(typeof window==="undefined")
return emptyStreak



const saved=
localStorage.getItem(KEY)



return saved
?
JSON.parse(saved)
:
emptyStreak


}
