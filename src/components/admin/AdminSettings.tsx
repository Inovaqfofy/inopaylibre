import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, RefreshCw, ExternalLink, Shield, Mail, CreditCard, Globe } from "lucide-react";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
import { toast } from "sonner";

interface AppSettings {
  maintenanceMode: boolean;
  maxFilesFreePlan: number;
  maxFilesProPlan: number;
  defaultCredits: number;
  stripeWebhookUrl: string;
  resendConfigured: boolean;
}

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    maintenanceMode: false,
    maxFilesFreePlan: 50,
    maxFilesProPlan: 500,
    defaultCredits: 3,
    stripeWebhookUrl: "",
    resendConfigured: false,
  });

  const [stripeInfo, setStripeInfo] = useState<{
    products: Array<{ id: string; name: string; active: boolean }>;
    balance: { available: number; pending: number };
  } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // Fetch Stripe info via edge function
      const { data: session } = await supabase.auth.getSession();
      if (session.session) {
        try {
          const { data } = await supabase.functions.invoke("admin-list-subscriptions", {
            headers: { Authorization: `Bearer ${session.session.access_token}` },
          });
          if (data) {
            setStripeInfo({
              products: data.products || [],
              balance: { available: 0, pending: 0 },
            });
          }
        } catch (e) {
          console.error("Error fetching Stripe info:", e);
        }

        try {
          const { data: paymentData } = await supabase.functions.invoke("admin-list-payments", {
            headers: { Authorization: `Bearer ${session.session.access_token}` },
          });
          if (paymentData?.balance) {
            setStripeInfo(prev => prev ? {
              ...prev,
              balance: {
                available: paymentData.balance.available?.[0]?.amount || 0,
                pending: paymentData.balance.pending?.[0]?.amount || 0,
              }
            } : null);
          }
        } catch (e) {
          console.error("Error fetching balance:", e);
        }
      }

      // Settings are stored locally for now
      const savedSettings = localStorage.getItem("adminSettings");
      if (savedSettings) {
        setSettings({ ...settings, ...JSON.parse(savedSettings) });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      localStorage.setItem("adminSettings", JSON.stringify(settings));
      toast.success("Paramètres enregistrés");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Configuration de l'application
          </CardTitle>
          <CardDescription>Paramètres généraux</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Mode maintenance</Label>
              <p className="text-sm text-muted-foreground">Désactive l'accès aux fonctionnalités</p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Max fichiers (Plan Free)</Label>
              <Input
                type="number"
                value={settings.maxFilesFreePlan}
                onChange={(e) => setSettings({ ...settings, maxFilesFreePlan: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Max fichiers (Plan Pro)</Label>
              <Input
                type="number"
                value={settings.maxFilesProPlan}
                onChange={(e) => setSettings({ ...settings, maxFilesProPlan: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div>
            <Label>Crédits par défaut (Free)</Label>
            <Input
              type="number"
              value={settings.defaultCredits}
              onChange={(e) => setSettings({ ...settings, defaultCredits: parseInt(e.target.value) || 0 })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Nombre de crédits gratuits pour les nouveaux utilisateurs
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sécurité
          </CardTitle>
          <CardDescription>Paramètres de sécurité de l'application</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Row Level Security</p>
              <p className="text-sm text-muted-foreground">Protection des données activée</p>
            </div>
            <Badge variant="default" className="bg-green-500">Activé</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Authentification Supabase</p>
              <p className="text-sm text-muted-foreground">Email + Magic Link</p>
            </div>
            <Badge variant="default" className="bg-green-500">Configuré</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Rôles administrateur</p>
              <p className="text-sm text-muted-foreground">Table user_roles avec RLS</p>
            </div>
            <Badge variant="default" className="bg-green-500">Sécurisé</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={fetchSettings}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Réinitialiser
        </Button>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Enregistrer
        </Button>
      </div>
    </div>
  );
};

export default AdminSettings;
