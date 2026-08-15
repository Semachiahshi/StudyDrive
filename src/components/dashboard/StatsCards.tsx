"use client"

type Props={
minutes:number
chapters:number
streak:number
achievements:number
}


export default function StatsCards({
minutes,
chapters,
streak,
achievements
}:Props){


const cards=[

{
title:"Čas studia",
value:`${minutes} min`,
icon:"⏱️"
},

{
title:"Dokončené kapitoly",
value:chapters,
icon:"📚"
},

{
title:"Streak",
value:`${streak} dní`,
icon:"🔥"
},

{
title:"Achievementy",
value:achievements,
icon:"🏆"
}

]


return (

<div className="
grid
grid-cols-2
md:grid-cols-4
gap-4
mb-8
">


{
cards.map(card=>(

<div

key={card.title}

className="
bg-white
rounded-3xl
p-5
shadow-sm
border
"

>

<div className="text-3xl mb-2">

{card.icon}

</div>


<div className="text-sm text-slate-500">

{card.title}

</div>


<div className="text-2xl font-black">

{card.value}

</div>


</div>

))

}


</div>

)

}
