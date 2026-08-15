import {StudyData} from "@/types/study"


export function exportBackup(data:StudyData){


const blob=new Blob(
[
JSON.stringify(
data,
null,
2
)
],
{
type:"application/json"
}
)


const url=
URL.createObjectURL(blob)


const a=document.createElement("a")

a.href=url

a.download=
"studydrive-backup.json"


a.click()


URL.revokeObjectURL(url)

}




export function importBackup(
file:File
):Promise<StudyData>{


return new Promise(
(resolve,reject)=>{


const reader=new FileReader()


reader.onload=()=>{

try{

resolve(
JSON.parse(
reader.result as string
)
)

}catch{

reject(
new Error("Neplatný soubor")
)

}


}


reader.onerror=reject


reader.readAsText(file)


}

)

}
