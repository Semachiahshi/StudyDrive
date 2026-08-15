import {importBackup,exportBackup} from "@/lib/backup"

import {StudyData} from "@/types/study"


export function useBackup(
data:StudyData,
update:(value:StudyData)=>void
){

function importFile(
e:React.ChangeEvent<HTMLInputElement>
){

const file=e.target.files?.[0]

if(!file)
return


importBackup(file)
.then((result:StudyData)=>{

update(result)

})

}


function exportFile(){

exportBackup(data)

}


return {
importFile,
exportFile
}

}
