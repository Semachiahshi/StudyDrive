"use client"

import ProgressChart from "@/components/ProgressChart"


type Props={
progress:number
}


export default function ProgressSection({
progress
}:Props){

return (

<section className="bg-white rounded-3xl p-6 mb-6">


<h2 className="font-bold text-xl">
📊 Pokrok
</h2>


<ProgressChart

progress={progress}

/>


</section>

)

}
