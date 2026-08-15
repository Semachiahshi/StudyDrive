"use client"

import {StudyNode} from "@/types/study"


type Props={
node:StudyNode
onAdd:(id:string,name:string)=>void
onProgress:(id:string)=>void
onDelete:(id:string)=>void

onComplete:()=>void
}



export default function TreeNode({
node,
onAdd,
onProgress,
onDelete,
onComplete
}:Props){


return (

<div className="mt-4 ml-5">


<div className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition">


<div className="flex justify-between items-center">


<div>

<h3 className="font-semibold text-lg">
{node.name}
</h3>


<p className="text-sm text-gray-500 mt-1">
{node.progress}% hotovo
</p>


</div>


<button

onClick={()=>onDelete(node.id)}

className="text-red-400 hover:text-red-600 text-xl">

×


</button>


</div>




<div className="mt-4 h-3 bg-gray-100 rounded-full overflow-hidden">


<div

className="h-full bg-blue-500 transition-all duration-500"

style={{
width:`${node.progress}%`
}}

/>


</div>




<div className="flex gap-3 mt-5">


<button

onClick={()=>{
onProgress(node.id)
onComplete()
}}

className="
px-4 py-2
rounded-xl
bg-green-100
text-green-700
font-medium
hover:bg-green-200
">

✓ Udělal jsem


</button>



<button

onClick={()=>{
const name=prompt("Název podkapitoly")

if(name){
onAdd(node.id,name)
}
}}

className="
px-4 py-2
rounded-xl
bg-blue-100
text-blue-700
font-medium
hover:bg-blue-200
">

＋ Podkapitola

</button>



</div>


</div>




{node.children.map(child=>(


<TreeNode

key={child.id}

node={child}

onAdd={onAdd}

onProgress={onProgress}

onDelete={onDelete}

onComplete={onComplete}

/>


))}


</div>


)

}
