import { permanentRedirect } from "next/navigation";

export default function BattleRedirectPage() {
  permanentRedirect("/arena?mode=battle");
}
