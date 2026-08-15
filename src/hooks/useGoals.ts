import {StudyData, StudyNode} from "@/types/study"
import {saveStudy} from "@/lib/storage"

function id(){
return crypto.randomUUID()
}

export function useGoals(
data:StudyData,
setData:(value:StudyData)=>void
){

function update(value:StudyData){
setData(value)
saveStudy(value)
}


function addGoal(name:string){

if(!name)return

update({

goals:[

...data.goals,

{

id:id(),

name,

nodes:[],

achievements:[]

}

]

})

}



function addChapter(
goalId:string,
chapter:string
){

if(!chapter)return


update({

goals:data.goals.map(g=>{

if(g.id!==goalId)
return g


return {

...g,

nodes:[

...g.nodes,

{

id:id(),

name:chapter,

progress:0,

children:[]

}

]

}

})

})


}



function addSubChapter(
goalId:string,
nodeId:string,
name:string
){

if(!name)
return


update({

goals:data.goals.map(g=>{

if(g.id!==goalId)
return g


function add(nodes:StudyNode[]):StudyNode[]{

return nodes.map(n=>{

if(n.id===nodeId){

return {

...n,

children:[

...n.children,

{

id:id(),

name,

progress:0,

children:[]

}

]

}

}


return {

...n,

children:add(n.children)

}

})

}


return {

...g,

nodes:add(g.nodes)

}

})

})

}


function progress(
goalId:string,
nodeId:string
){

update({

goals:data.goals.map(g=>{

if(g.id!==goalId)
return g


function edit(nodes:StudyNode[]):StudyNode[]{

return nodes.map(n=>{

if(n.id===nodeId){

return {

...n,

progress:Math.min(
100,
n.progress+10
)

}

}


return {

...n,

children:edit(n.children)

}

})

}


return {

...g,

nodes:edit(g.nodes)

}

})

})

}



function remove(
goalId:string,
nodeId:string
){

update({

goals:data.goals.map(g=>{

if(g.id!==goalId)
return g


function filter(nodes:StudyNode[]):StudyNode[]{

return nodes
.filter(n=>n.id!==nodeId)
.map(n=>({

...n,

children:filter(n.children)

}))

}


return {

...g,

nodes:filter(g.nodes)

}

})

})

}


return {

addGoal,
addChapter,
addSubChapter,
progress,
remove

}

}
