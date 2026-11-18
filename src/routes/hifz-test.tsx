import { createFileRoute } from "@tanstack/react-router";
import { HifzSpeechTest } from "@/components/hifz-stt";

export const Route = createFileRoute("/hifz-test")({ component: HifzSpeechTest });
