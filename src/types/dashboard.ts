import {ActivityDay} from "@/lib/activity"

export type DashboardStats={
minutes:number
completedChapters:number
totalAchievements:number
averageProgress:number
}


export type DashboardBadge={
name:string
icon:string
done:boolean
}


export type DashboardStreak={
current:number
}


export type DashboardActivity=ActivityDay[]
