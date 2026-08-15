import {useState} from "react"

import {
loadTheme,
saveTheme
} from "@/lib/theme"


export function useTheme(){

const [dark,setDark]=useState(
()=>loadTheme()
)


function toggleTheme(){

const value=!dark

setDark(value)

saveTheme(value)

}


return {
dark,
toggleTheme
}

}
