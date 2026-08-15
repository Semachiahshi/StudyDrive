export type StudyNode = {
  id:string
  name:string
  progress:number
  children:StudyNode[]
}


export type Achievement = {
  id:string
  text:string
  minutes:number
  date:string
}


export type Goal = {
  id:string
  name:string
  deadline?:string
  nodes:StudyNode[]
  achievements:Achievement[]
}


export type StudyData = {
  goals:Goal[]
}
