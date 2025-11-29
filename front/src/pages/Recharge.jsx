
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Smartphone, CheckCircle, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { callBackendFunction } from "@/components/backend";

export default function Recharge() {
  const [phone, setPhone] = useState("");
  const [operator, setOperator] = useState("MTN");
  const [amount, setAmount] = useState("");
  const [callBackend, setCallBackend] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdTx, setCreatedTx] = useState(null);

  /*useEffect(() => {
    loadUser();
  }, []);*/

  /*const loadUser = async () => {
    const me = await User.me();
    if (me?.phone) setPhone(me.phone);
  };*/

  const reference = () => `PLA${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0,14)}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    /*setSubmitting(true);

    const ref = reference();
    const tx = await Transaction.create({
      type: "recharge_credit",
      operator,
      amount: Number(amount),
      recipient_phone: phone,
      status: "pending",
      reference: ref,
      description: `Recharge crédit ${operator}`,
      fee: 0
    });

    if (callBackend) {
      await callBackendFunction("recharge", {
        transaction_id: tx.id,
        operator,
        phone,
        amount: Number(amount),
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                Requête envoyée
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-neutral-600">Votre demande de recharge a été enregistrée et est en cours de traitement.</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-neutral-500">Opérateur</div><div className="font-medium">{createdTx.operator}</div>
                <div className="text-neutral-500">Montant</div><div className="font-medium">{new Intl.NumberFormat('fr-FR').format(createdTx.amount)} XOF</div>
                <div className="text-neutral-500">Numéro</div><div className="font-medium">{createdTx.recipient_phone}</div>
                <div className="text-neutral-500">Référence</div><div className="font-mono">{createdTx.reference}</div>
                <div className="text-neutral-500">Statut</div>
                <div><Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">pending</Badge></div>
              </div>
              <div className="flex gap-3 pt-2">
                <Link to={createPageUrl("Transactions")}><Button variant="outline">Voir transactions</Button></Link>
                <Button onClick={() => { setCreatedTx(null); setAmount(""); }} className="bg-gradient-to-r from-orange-500 to-red-500 text-white">Nouvelle recharge</Button>
              </div>
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
          <Link to={createPageUrl("Dashboard")} className="inline-flex"><Button variant="outline" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <h1 className="text-2xl font-bold">Recharge crédit</h1>
        </div>
        <Card className="card-glow border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Smartphone className="w-5 h-5" /> MTN · Moov · Celtiis</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-2">
                <Label>Opérateur</Label>
                <Select value={operator} onValueChange={setOperator}>
                  <SelectTrigger><SelectValue placeholder="Choisir un opérateur" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MTN">MTN</SelectItem>
                    <SelectItem value="Moov">Moov</SelectItem>
                    <SelectItem value="Celtiis">Celtiis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Numéro de téléphone</Label>
                <Input placeholder="+229XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              <div className="grid gap-2">
                <Label>Montant (XOF)</Label>
                <Input type="number" min="100" step="50" placeholder="Ex: 1000" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>

              <div className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <p className="text-sm font-medium">Appeler le backend</p>
                  <p className="text-xs text-neutral-500">Sinon, enregistre en pending (simulation)</p>
                </div>
                <Switch checked={callBackend} onCheckedChange={setCallBackend} />
              </div>

              <Button type="submit" disabled={submitting || !amount || !phone} className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white">
                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Envoi...</> : "Confirmer la recharge"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
