"use client"

import {DashboardBadge} from "@/types/dashboard"


type Props={
badges:DashboardBadge[]
}


export default function Achievements({
badges
}:Props){

return (

<section className="bg-white rounded-3xl p-6">

<h2 className="font-bold text-xl mb-4">
🏅 Achievementy
</h2>


<div className="grid grid-cols-2 md:grid-cols-5 gap-3">

{
badges.map(b=>(

<div
key={b.name}
className={`
border rounded-xl p-3 text-center
${b.done?"":"opacity-40"}
`}
>

<div className="text-3xl">
{b.icon}
</div>

{b.name}

</div>

))
}

</div>

</section>

)

}
