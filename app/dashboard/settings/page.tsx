import SettingsFormClient from "@/app/ui/settings/settings";
import { getUserID, getUserSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const userId = await getUserID();
  if (userId === null) {
    return <p>You must be logged in</p>;
  }

  const settings = (await getUserSettings(userId)) ?? null;

  return <SettingsFormClient settings={settings} />;
}
