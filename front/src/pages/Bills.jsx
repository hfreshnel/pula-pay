
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Receipt, CheckCircle, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Bills() {
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState(null);
  const [contractRef, setContractRef] = useState("");
  const [amount, setAmount] = useState("");
  const [callBackend, setCallBackend] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdTx, setCreatedTx] = useState(null);

  /*useEffect(() => { loadServices(); }, []);
  const loadServices = async () => {
    const actives = await Service.filter({ category: "bills", is_active: true });
    setServices(actives);
    if (actives.length) setServiceId(actives[0].id);
  };*/

  const service = services.find(s => s.id === serviceId);
  const reference = () => `PLA${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0,14)}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    /*setSubmitting(true);

    const tx = await Transaction.create({
      type: "bill_payment",
      operator: service?.operator || "SBEE",
      amount: Number(amount),
      status: "pending",
      reference: reference(),
      description: `${service?.name} - réf ${contractRef}`,
      fee: service?.fixed_fee || 0,
      external_reference: contractRef
    });

    if (callBackend) {
      await callBackendFunction("payBill", {
        transaction_id: tx.id,
        service: service?.name,
        operator: service?.operator,
        contract_ref: contractRef,
        amount: Number(amount),
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
            <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-600" /> Paiement lancé</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-neutral-500">Service</div><div className="font-medium">{service?.name}</div>
                <div className="text-neutral-500">Montant</div><div className="font-medium">{new Intl.NumberFormat('fr-FR').format(createdTx.amount)} XOF</div>
                <div className="text-neutral-500">Réf. contrat</div><div className="font-medium">{contractRef}</div>
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
          <h1 className="text-2xl font-bold">Paiement de factures</h1>
        </div>
        <Card className="card-glow border-0">
          <CardHeader><CardTitle className="flex items-center gap-2"><Receipt className="w-5 h-5" /> SBEE · Canal+</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-2">
                <Label>Service</Label>
                <Select value={serviceId || ""} onValueChange={setServiceId}>
                  <SelectTrigger><SelectValue placeholder="Choisir un service" /></SelectTrigger>
                  <SelectContent>
                    {services.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name} ({s.operator})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Référence / N° contrat</Label>
                <Input placeholder="Ex: SBEE-XXXXXXXX" value={contractRef} onChange={(e) => setContractRef(e.target.value)} />
              </div>

              <div className="grid gap-2">
                <Label>Montant (XOF)</Label>
                <Input type="number" min="100" step="50" placeholder="Ex: 10000" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>

              <div className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <p className="text-sm font-medium">Appeler le backend</p>
                  <p className="text-xs text-neutral-500">Sinon, enregistre en pending (simulation)</p>
                </div>
                <Switch checked={callBackend} onCheckedChange={setCallBackend} />
              </div>

              <Button type="submit" disabled={submitting || !serviceId || !amount || !contractRef} className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white">
                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Envoi...</> : "Payer la facture"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
