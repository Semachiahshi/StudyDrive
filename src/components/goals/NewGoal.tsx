"use client"

type Props={
goal:string
setGoal:(value:string)=>void
addGoal:(name:string)=>void
}


export default function NewGoal({
goal,
setGoal,
addGoal
}:Props){

return (

<section className="
bg-white
dark:bg-slate-900
rounded-3xl
p-6
mb-6
">

<h2 className="font-bold text-xl">
Nový cíl
</h2>


<div className="flex gap-3 mt-4">


<input

className="border rounded-xl p-3 flex-1"

value={goal}

onChange={(e)=>setGoal(e.target.value)}

placeholder="Maturita"

/>


<button

className="bg-blue-600 text-white px-5 rounded-xl"

onClick={()=>addGoal(goal)}

>

+

</button>


</div>


</section>

)

}
