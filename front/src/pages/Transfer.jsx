
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Send, CheckCircle, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Transfer() {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [callBackend, setCallBackend] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdTx, setCreatedTx] = useState(null);

  const reference = () => `PLA${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0,14)}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    /*setSubmitting(true);

    const ref = reference();
    const tx = await Transaction.create({
      type: "transfer_money",
      operator: "Celtiis",
      amount: Number(amount),
      recipient_phone: recipient,
      status: "pending",
      reference: ref,
      description: note || "Transfert CeltiisCash",
      fee: Math.round(Number(amount) * 0.015)
    });

    if (callBackend) {
      await callBackendFunction("transfer", {
        transaction_id: tx.id,
        operator: "Celtiis",
        recipient,
        amount: Number(amount),
        note,
        ussd_code: "1997*7#",
        reference: ref
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
            <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-600" /> Transfert initié</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-neutral-500">Bénéficiaire</div><div className="font-medium">{createdTx.recipient_phone}</div>
                <div className="text-neutral-500">Montant</div><div className="font-medium">{new Intl.NumberFormat('fr-FR').format(createdTx.amount)} XOF</div>
                <div className="text-neutral-500">Frais</div><div className="font-medium">{new Intl.NumberFormat('fr-FR').format(createdTx.fee)} XOF</div>
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
          <h1 className="text-2xl font-bold">Transfert CeltiisCash</h1>
        </div>
        <Card className="card-glow border-0">
          <CardHeader><CardTitle className="flex items-center gap-2"><Send className="w-5 h-5" /> 1997*7#</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-2">
                <Label>Numéro du bénéficiaire</Label>
                <Input placeholder="+229XXXXXXXX" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Montant (XOF)</Label>
                <Input type="number" min="100" step="50" placeholder="Ex: 5000" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Note (optionnel)</Label>
                <Input placeholder="Ex: soutien" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>

              <div className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <p className="text-sm font-medium">Appeler le backend</p>
                  <p className="text-xs text-neutral-500">Sinon, enregistre en pending (simulation)</p>
                </div>
                <Switch checked={callBackend} onCheckedChange={setCallBackend} />
              </div>

              <Button type="submit" disabled={submitting || !recipient || !amount} className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white">
                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Envoi...</> : "Confirmer le transfert"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
