const KEY="studydrive-theme"


export function loadTheme(){

if(typeof window==="undefined")
return false


return localStorage.getItem(KEY)==="dark"

}



export function saveTheme(
dark:boolean
){

if(typeof window==="undefined")
return


localStorage.setItem(
KEY,
dark?"dark":"light"
)


document.documentElement.classList.toggle(
"dark",
dark
)

}
