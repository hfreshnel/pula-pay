import React from "react";
import { useAuthContext } from "@/components/common/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trash2, Edit, Plus, Smartphone, CreditCard, Building2, Image } from "lucide-react";
import PaymentMethodForm from "../components/profile/PaymentMethodForm";

export default function ProfilePage() {
  const [me, setMe] = React.useState({
  id: "user_123456",
  full_name: "Jean Dupont1", 
  email: "me@mail.com",
  phone: "+22961234567"
});

const [settings, setSettings] = React.useState({
  full_name: "Jean Dupont",
  email: "test@mail.com",
  phone_number: "+22961234567",
  address: "123 Rue Exemple, Cotonou, Bénin",
  preferred_language: "fr", 
  default_currency: "XOF",
  notifications_push: true,
  notifications_email: false,
  notifications_sms: true,
  privacy_mask_balance: false,
  privacy_mask_history: true,
  two_factor_enabled: true,
  two_factor_method: "SMS",
  transaction_pin: "****"
});
  const [methods, setMethods] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const { logout } = useAuthContext();
  const navigate = useNavigate();

  // Payment modal
  const [openPM, setOpenPM] = React.useState(false);
  const [editingPM, setEditingPM] = React.useState(null);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    // todo: implement profile save
  };

  const handlePrefsSave = async (e) => {
    e.preventDefault();
    //todo: implement preferences save
  };

  const openAddPM = () => {
    //todo: implement open add payment method
  };

  const handlePMSubmit = async (data) => {
    //todo: implement payment method submit
  };

  const deletePM = async (pm) => {
    //todo: implement delete payment method
  };

  if (loading || !settings) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  const statusBadge = (s) =>
    s === "active"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-neutral-50 text-neutral-700 border-neutral-200";

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Profil & Paramètres</h1>
            <p className="text-neutral-500">Gérez votre compte, vos moyens de paiement et vos préférences</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => { logout(); navigate('/login'); }} className="text-sm text-red-600">
              Déconnexion
            </Button>
          </div>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="bg-neutral-100">
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="payments">Méthodes de paiement</TabsTrigger>
            <TabsTrigger value="preferences">Préférences & Sécurité</TabsTrigger>
          </TabsList>

          {/* Onglet Profil */}
          <TabsContent value="profile" className="pt-4">
            <Card className="card-glow border-0">
              <CardHeader>
                <CardTitle>Informations personnelles</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSave} className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="grid gap-2">
                      <Label>Nom complet</Label>
                      <Input value={settings.full_name || me.full_name || ""} readOnly />
                      <p className="text-xs text-neutral-500">Nom issu de votre compte — non modifiable ici.</p>
                    </div>
                    <div className="grid gap-2">
                      <Label>Email</Label>
                      <Input value={settings.email || me.email || ""} readOnly />
                    </div>
                    <div className="grid gap-2">
                      <Label>Téléphone</Label>
                      <Input name="phone_number" defaultValue={settings.phone_number || me.phone || ""} placeholder="+229XXXXXXXX" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Adresse</Label>
                      <Input name="address" defaultValue={settings.address || ""} placeholder="Adresse complète" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid gap-2">
                      <Label>Photo de profil</Label>
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-20 rounded-2xl bg-neutral-100 flex items-center justify-center overflow-hidden">
                          {settings.profile_picture_url ? (
                            <img src={settings.profile_picture_url} alt="Profil" className="w-full h-full object-cover" />
                          ) : (
                            <Image className="w-6 h-6 text-neutral-400" />
                          )}
                        </div>
                        <Input type="file" name="profile_picture" accept="image/*" />
                      </div>
                      <p className="text-xs text-neutral-500">PNG/JPG. 2 Mo max.</p>
                    </div>
                    <div className="pt-2">
                      <Button type="submit" disabled={saving} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                        {saving ? "Enregistrement..." : "Enregistrer"}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Méthodes de paiement */}
          <TabsContent value="payments" className="pt-4">
            <Card className="card-glow border-0">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Méthodes liées</CardTitle>
                <Button onClick={openAddPM} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                  <Plus className="w-4 h-4 mr-2" /> Ajouter
                </Button>
              </CardHeader>
              <CardContent>
                {methods.length === 0 ? (
                  <div className="text-center py-8 text-neutral-600">
                    Aucun moyen de paiement lié pour l’instant.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {methods.map((m) => (
                      <div key={m.id} className="flex items-center justify-between p-4 rounded-xl border border-neutral-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center">
                            {m.type === "momo" && <Smartphone className="w-5 h-5 text-neutral-600" />}
                            {m.type === "card" && <CreditCard className="w-5 h-5 text-neutral-600" />}
                            {m.type === "bank" && <Building2 className="w-5 h-5 text-neutral-600" />}
                          </div>
                          <div>
                            <div className="font-semibold text-neutral-900">{m.provider_name} <span className="text-neutral-400 font-normal">({m.type})</span></div>
                            <div className="text-sm text-neutral-600">{m.account_number}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${statusBadge(m.status)} border`}>{m.status || "active"}</Badge>
                          <Button variant="ghost" onClick={() => { setEditingPM(m); setOpenPM(true); }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" className="text-red-600" onClick={() => deletePM(m)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <PaymentMethodForm
              open={openPM}
              onOpenChange={setOpenPM}
              initialData={editingPM}
              onSubmit={handlePMSubmit}
            />
          </TabsContent>

          {/* Onglet Préférences & Sécurité */}
          <TabsContent value="preferences" className="pt-4">
            <Card className="card-glow border-0">
              <CardHeader>
                <CardTitle>Préférences générales</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePrefsSave} className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label>Langue</Label>
                      <Select name="preferred_language" defaultValue={settings.preferred_language || "fr"}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="fon">Fon</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label>Devise par défaut</Label>
                      <Select name="default_currency" defaultValue={settings.default_currency || "XOF"}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="XOF">XOF</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label>Masquer le solde</Label>
                      <div className="flex items-center justify-between rounded-xl border p-3">
                        <span className="text-sm text-neutral-700">Masquer le solde par défaut</span>
                        <Switch name="privacy_mask_balance" defaultChecked={!!settings.privacy_mask_balance} />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label>Masquer l’historique</Label>
                      <div className="flex items-center justify-between rounded-xl border p-3">
                        <span className="text-sm text-neutral-700">Masquer l’historique des transactions</span>
                        <Switch name="privacy_mask_history" defaultChecked={!!settings.privacy_mask_history} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label>Notifications</Label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between rounded-xl border p-3">
                          <span className="text-sm text-neutral-700">Push</span>
                          <Switch name="notifications_push" defaultChecked={settings.notifications_push !== false} />
                        </div>
                        <div className="flex items-center justify-between rounded-xl border p-3">
                          <span className="text-sm text-neutral-700">Email</span>
                          <Switch name="notifications_email" defaultChecked={!!settings.notifications_email} />
                        </div>
                        <div className="flex items-center justify-between rounded-xl border p-3">
                          <span className="text-sm text-neutral-700">SMS</span>
                          <Switch name="notifications_sms" defaultChecked={!!settings.notifications_sms} />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label>Double authentification (2FA)</Label>
                      <div className="flex items-center justify-between rounded-xl border p-3">
                        <span className="text-sm text-neutral-700">Activer la 2FA</span>
                        <Switch name="two_factor_enabled" defaultChecked={!!settings.two_factor_enabled} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Méthode</Label>
                        <Select name="two_factor_method" defaultValue={settings.two_factor_method || "SMS"}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SMS">SMS</SelectItem>
                            <SelectItem value="App">Application d’authentification</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label>PIN de transaction (4 chiffres)</Label>
                      <Input name="transaction_pin" placeholder="****" maxLength={4} />
                      <p className="text-xs text-neutral-500">Pour votre sécurité, le PIN n’est jamais affiché.</p>
                    </div>

                    <div className="pt-2">
                      <Button type="submit" disabled={saving} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                        {saving ? "Enregistrement..." : "Enregistrer"}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}