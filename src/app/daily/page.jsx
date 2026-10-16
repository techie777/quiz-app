import { permanentRedirect } from "next/navigation";

export default function DailyIndexPage() {
  permanentRedirect("/daily-quiz");
}
