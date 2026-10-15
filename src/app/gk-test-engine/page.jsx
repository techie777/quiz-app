import { redirect } from "next/navigation";

export const metadata = {
  title: "GK टेस्ट इंजन - अपनी पसंद का क्विज़ बनाएं | QuizWeb",
  description: "2 टैप में अपनी पसंद के विषयों, प्रश्न संख्या और टाइमर सेटिंग्स के साथ कस्टम क्विज़ बनाएं।",
  alternates: {
    canonical: "/arena",
  },
};

export default function GKTestEngineRedirect() {
  redirect("/arena");
}
