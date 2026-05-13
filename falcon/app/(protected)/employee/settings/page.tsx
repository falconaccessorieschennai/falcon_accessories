import SettingsPanel from '@/components/settings/SettingsPanel';

export default function EmployeeSettingsPage() {
  return (
    <div className="p-6 lg:pl-8 max-w-4xl mx-auto">
      <h1 className="text-text-primary text-2xl font-bold mb-6">Settings</h1>
      <SettingsPanel />
    </div>
  );
}
