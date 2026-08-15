"use client"

type Props={
dark:boolean
onTheme:()=>void
onExport:()=>void
onImport:(e:React.ChangeEvent<HTMLInputElement>)=>void
}


export default function DashboardHeader({
dark,
onTheme,
onExport,
onImport
}:Props){


return (

<div className="
flex
flex-wrap
gap-3
mb-6
">


<button

onClick={onTheme}

className="
px-4
py-2
rounded-xl
bg-slate-900
text-white
">

{dark ? "☀️ Světlý režim" : "🌙 Tmavý režim"}

</button>



<button

onClick={onExport}

className="
px-4
py-2
rounded-xl
bg-blue-600
text-white
">

⬇️ Export

</button>



<label

className="
px-4
py-2
rounded-xl
bg-green-600
text-white
cursor-pointer
">

⬆️ Import


<input

type="file"

accept=".json"

className="hidden"

onChange={onImport}

/>


</label>


</div>

)

}
