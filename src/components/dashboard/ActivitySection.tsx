"use client"

import ActivityCalendar from "@/components/ActivityCalendar"
import {ActivityDay} from "@/lib/activity"


type Props={
activity:ActivityDay[]
}


export default function ActivitySection({
activity
}:Props){

return (

<section className="
bg-white
dark:bg-slate-900
rounded-3xl
p-6
mb-6
">

<h2 className="font-bold text-xl mb-4">
🔥 Aktivita
</h2>


<ActivityCalendar
data={activity}
/>


</section>

)

}
