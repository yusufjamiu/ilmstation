import { createFileRoute } from "@tanstack/react-router";
import { AppGate } from "@/components/app-gate";

export const Route = createFileRoute("/app")({
  head:()=>({meta:[
    {title:"Today’s Quest — IlmStation Dashboard"},
    {name:"description",content:"Continue today’s Islamic learning quest and review your progress."},
    {property:"og:title",content:"Today’s Quest — IlmStation Dashboard"},
    {property:"og:description",content:"Continue your daily Islamic learning journey."},
    {property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"},
  ]}),component:AppGate,
});