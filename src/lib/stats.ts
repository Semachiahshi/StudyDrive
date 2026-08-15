import {StudyData,StudyNode} from "@/types/study"


export function getStats(data:StudyData){

const achievements=data.goals.flatMap(
g=>g.achievements
)


const nodes=data.goals.flatMap(
g=>flattenNodes(g.nodes)
)


const completed=nodes.filter(
n=>n.progress>=100
).length


const progress=nodes.length
?
Math.round(
nodes.reduce(
(a,b)=>a+b.progress,
0
)/nodes.length
)
:0


return {

totalAchievements:achievements.length,

minutes:
achievements.reduce(
(a,b)=>a+b.minutes,
0
),

completedChapters:completed,

averageProgress:progress

}

}



function flattenNodes(nodes:StudyNode[]):StudyNode[]{

return nodes.flatMap(
n=>[
n,
...flattenNodes(n.children)
]
)

}
