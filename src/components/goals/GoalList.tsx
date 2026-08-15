"use client"

import {useState} from "react"
import TreeNode from "@/components/TreeNode"
import {Goal} from "@/types/study"


type Props={
goals:Goal[]
addChapter:(goalId:string,name:string)=>void
updateProgress:(goalId:string,nodeId:string)=>void
removeNode:(goalId:string,nodeId:string)=>void
addSubChapter:(goalId:string,nodeId:string,name:string)=>void
removeGoal:(goalId:string)=>void

addActivity:()=>void
}


export default function GoalList({
goals,
addChapter,
updateProgress,
removeNode,
addSubChapter,
removeGoal,
addActivity
}:Props){

const [chapter,setChapter]=useState("")


return (

<div>

{
goals.map(goal=>(

<div
key={goal.id}
className="
bg-white
dark:bg-slate-900
rounded-3xl
p-6
mb-6
"
>


<div className="flex justify-between items-center mb-4">

<h2 className="font-bold text-xl">
{goal.name}
</h2>


<button

onClick={()=>removeGoal(goal.id)}

className="text-red-500"

>
Smazat
</button>

</div>


<div className="flex gap-3 mb-4">

<input

value={chapter}

onChange={(e)=>setChapter(e.target.value)}

placeholder="Nová kapitola"

className="border rounded-xl px-4 py-2 flex-1"

/>


<button

onClick={()=>addChapter(goal.id,chapter)}

className="bg-blue-600 text-white rounded-xl px-4"

>

+

</button>


</div>


{
goal.nodes.map(node=>(

<TreeNode

key={node.id}

node={node}

onAdd={(nodeId,name)=>addSubChapter(goal.id,nodeId,name)}

onProgress={(id)=>updateProgress(goal.id,id)}

onDelete={(id)=>removeNode(goal.id,id)}

onComplete={addActivity}

/>

))
}


</div>

))

}

</div>

)

}
