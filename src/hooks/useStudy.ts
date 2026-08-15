import {useState} from "react"

import {
StudyData
} from "@/types/study"

import {
loadStudy,
saveStudy
} from "@/lib/storage"


const emptyData:StudyData={
goals:[]
}


export function useStudy(){

const [data,setData]=useState<StudyData>(
()=>loadStudy() ?? emptyData
)


function update(value:StudyData){

setData(value)

saveStudy(value)

}


return {
data,
update
}

}
