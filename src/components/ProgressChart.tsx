"use client"

import {
PieChart,
Pie,
Cell,
ResponsiveContainer
} from "recharts"



type Props={
progress:number
}



export default function ProgressChart({
progress
}:Props){


const data=[

{
name:"Hotovo",
value:progress
},

{
name:"Zbývá",
value:100-progress
}

]



return (

<div className="
h-64
w-full
">


<ResponsiveContainer
width="100%"
height="100%"
>


<PieChart>


<Pie

data={data}

dataKey="value"

innerRadius={70}

outerRadius={95}

startAngle={90}

endAngle={-270}

>


{
data.map(
(entry,index)=>(

<Cell
key={index}
/>

)
)
}


</Pie>


</PieChart>


</ResponsiveContainer>


<div className="
text-center
-mt-36
font-black
text-4xl
">

{progress}%

</div>


</div>

)

}
