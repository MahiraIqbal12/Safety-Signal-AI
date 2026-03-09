import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MessageCircle, Mail, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const channels = [
  { id: "whatsapp", label: "WhatsApp Alerts", icon: MessageCircle, defaultOn: true },
  { id: "email", label: "Email Alerts", icon: Mail, defaultOn: true },
  { id: "slack", label: "Slack Alerts", icon: Hash, defaultOn: false },
];

const SettingsPage = () => {
  const [states, setStates] = useState<Record<string, boolean>>(
    Object.fromEntries(channels.map((c) => [c.id, c.defaultOn]))
  );
  const { toast } = useToast();

  const toggle = (id: string) => {
    const next = !states[id];
    setStates((s) => ({ ...s, [id]: next }));
    toast({ title: `${id.charAt(0).toUpperCase() + id.slice(1)} alerts ${next ? "enabled" : "disabled"}` });
  };

  return (
    <AppLayout title="Settings">
      <div className="max-w-xl space-y-6 animate-fade-in">
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold text-card-foreground mb-4">Alert Channels</h3>
          <div className="space-y-4">
            {channels.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <c.icon className="w-5 h-5 text-muted-foreground" />
                  <Label htmlFor={c.id} className="text-sm font-medium text-card-foreground">{c.label}</Label>
                </div>
                <Switch id={c.id} checked={states[c.id]} onCheckedChange={() => toggle(c.id)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
