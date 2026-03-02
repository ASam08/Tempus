import SettingsFormClient from "@/app/ui/settings/settings";
import { getUserID, getUserSettings } from "@/lib/data";

export default async function SettingsPage() {
  const userId = await getUserID();
  if (!userId) {
    return <p>You must be logged in</p>;
  }

  const startTime =
    (await getUserSettings(userId, "start_time"))?.setting_value ?? "09:00";
  const endTime =
    (await getUserSettings(userId, "end_time"))?.setting_value ?? "17:00";

  return (
    <SettingsFormClient
      userId={userId}
      startTime={startTime}
      endTime={endTime}
    />
  );
}
