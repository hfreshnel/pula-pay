
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Wifi, CheckCircle, ArrowLeft, Loader2, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Input } from "@/components/ui/input"; // Added Input import

const PASSES = [
  { id: "cel-500", label: "Celtiis 1 Go / 24h", amount: 500 },
  { id: "cel-1500", label: "Celtiis 3 Go / 3j", amount: 1500 },
  { id: "cel-3000", label: "Celtiis 6 Go / 7j", amount: 3000 },
  { id: "cel-10000", label: "Celtiis 25 Go / 30j", amount: 10000 }
];

export default function Internet() {
  const [passId, setPassId] = useState(PASSES[0].id);
  const [phone, setPhone] = useState("");
  const [callBackend, setCallBackend] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdTx, setCreatedTx] = useState(null);

  const current = PASSES.find(p => p.id === passId);
  const reference = () => `PLA${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0,14)}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    /*setSubmitting(true);

    const tx = await Transaction.create({
      type: "recharge_data",
      operator: "Celtiis",
      amount: current.amount,
      recipient_phone: phone,
      status: "pending",
      reference: reference(),
      description: `Pass Internet ${current.label}`,
      fee: 50
    });

    if (callBackend) {
      await callBackendFunction("buyData", {
        transaction_id: tx.id,
        operator: "Celtiis",
        phone,
        amount: current.amount,
        pass_code: "*199*4#",
        reference: tx.reference
      });
    }

    setCreatedTx(tx);
    setSubmitting(false);*/
  };

  if (createdTx) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-white p-4 md:p-8">
        <div className="max-w-xl mx-auto">
          <Card className="card-glow border-0">
            <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-600" /> Demande envoyée</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-neutral-600">Votre achat de pass Celtiis est en cours.</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-neutral-500">Pass</div><div className="font-medium">{createdTx.description}</div>
                <div className="text-neutral-500">Montant</div><div className="font-medium">{new Intl.NumberFormat('fr-FR').format(createdTx.amount)} XOF</div>
                <div className="text-neutral-500">Numéro</div><div className="font-medium">{createdTx.recipient_phone}</div>
                <div className="text-neutral-500">Référence</div><div className="font-mono">{createdTx.reference}</div>
              </div>
              <Link to={createPageUrl("Transactions")}><Button variant="outline">Voir transactions</Button></Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-white p-4 md:p-8">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to={createPageUrl("Dashboard")}><Button variant="outline" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <h1 className="text-2xl font-bold">Pass Internet Celtiis</h1>
        </div>
        <Card className="card-glow border-0">
          <CardHeader><CardTitle className="flex items-center gap-2"><Wifi className="w-5 h-5" /> Achat via 1994#</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-2">
                <Label>Choisir un pass</Label>
                <Select value={passId} onValueChange={setPassId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PASSES.map(p => <SelectItem key={p.id} value={p.id}>{p.label} — {new Intl.NumberFormat('fr-FR').format(p.amount)} XOF</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Numéro de téléphone</Label>
                <Input placeholder="+229XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              <div className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <p className="text-sm font-medium">Appeler le backend</p>
                  <p className="text-xs text-neutral-500">Sinon, enregistre en pending (simulation)</p>
                </div>
                <Switch checked={callBackend} onCheckedChange={setCallBackend} />
              </div>

              <Button type="submit" disabled={submitting || !phone} className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white">
                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Envoi...</> : "Acheter le pass"}
              </Button>

              <div className="text-xs text-neutral-500 mt-2 flex items-center gap-2">
                <Info className="w-3 h-3" /> En l’absence d’API publique, PulaPay utilise 1994# (USSD) côté backend.
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
