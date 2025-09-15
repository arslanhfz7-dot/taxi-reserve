import "server-only";
import NewReminder from "./ui/NewReminder";
import RemindersList from "./ui/RemindersList";

export const metadata = { title: "Reminders" };

export default async function RemindersPage() {
  // Server shell – the list and form are client components fetching from API
  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="text-2xl font-semibold mb-4">Reminders</h1>
      <NewReminder />
      <div className="h-6" />
      <RemindersList />
    </div>
  );
}
