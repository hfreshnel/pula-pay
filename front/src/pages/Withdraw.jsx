import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Wallet, CheckCircle, Loader2, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl, sanitizeMsisdn } from "@/utils";

import { useWithdraw } from "@/hooks/useWithdraw";

export default function Withdraw() {
  const [me, setMe] = useState(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("MTN_MoMo");
  const [phone, setPhone] = useState("");

  const [isWaiting, setIsWaiting] = useState(false);

  const [submittedTx, setSubmittedTx] = useState(null);
  const { txId, status, loading, error, startWithdraw } = useWithdraw();

  useEffect(() => {
    if (status === "SUCCESS" && !submittedTx) {
      setIsWaiting(false);
      setSubmittedTx({
        amount,
        recipient_phone: sanitizeMsisdn(phone),
        method,
        txId
      });
    } else if (error) {
      setIsWaiting(false);
    }
  }, [status, submittedTx, amount, phone, method, txId, error]);

  const fee = () => {
    const amt = Number(amount || 0);
    // Exemple: 1% de frais, min 100 EUR, max 1500 EUR
    const f = Math.min(Math.max(Math.round(amt * 0.01), 100), 1500);
    return isNaN(f) ? 0 : f;
  };

  const canSubmit = () => {
    const amt = Number(amount);
    if (!amt) return false;
    if (method === "MTN_MoMo") {
      return Boolean(phone);
    }
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsWaiting(true);

    const msisdn = sanitizeMsisdn(phone);

    //const operator = method.includes("MTN") ? "MTN" : method.includes("Moov") ? "Moov" : undefined;
    if (method === "MTN_MoMo") {
      await startWithdraw({ userId: "d9c5a0b2-0f7c-4f3b-9a86-3f8f57b0b2a1", amount: String(amount), msisdn: msisdn, currency: "EUR" });
    } else {
      alert("Méthode non encore supportée");
      setIsWaiting(false);
    }
  };

  if (submittedTx) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-white p-4 md:p-8">
        <div className="max-w-xl mx-auto">
          <Card className="card-glow border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                Retrait effectué
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-neutral-500">Méthode</div>
                <div className="font-medium">{submittedTx.method}</div>
                <div className="text-neutral-500">Montant</div>
                <div className="font-medium">
                  {new Intl.NumberFormat('fr-FR').format(submittedTx.amount)} EUR
                </div>
                <div className="text-neutral-500">Numéro</div>
                <div className="font-medium">{submittedTx.recipient_phone}</div>
                {submittedTx.txId && (
                  <>
                    <div className="text-neutral-500">txId</div>
                    <div className="font-mono text-xs break-all">{submittedTx.txId}</div>
                  </>
                )}
              </div>
              <Link to={createPageUrl("Transactions")}>
                <Button variant="outline">Voir transactions</Button>
              </Link>
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
          <Link to={createPageUrl("Wallet")}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Demande de retrait</h1>
        </div>

        <Card className="card-glow border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              Retirer depuis votre portefeuille
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
                <p className="font-medium">Erreur</p>
                <p className="text-sm">{error.message || "Une erreur est survenue"}</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="grid gap-2">
                <Label>Montant à retirer (EUR)</Label>
                <Input
                  type="number"
                  min="500"
                  step="100"
                  placeholder="Ex: 5000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <p className="text-xs text-neutral-500">
                  Frais estimés: {new Intl.NumberFormat("fr-FR").format(fee())} EUR
                </p>
              </div>

              <div className="grid gap-2">
                <Label>Moyen de paiement</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MTN_MoMo">MTN MoMo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Numéro associé</Label>
                <Input
                  placeholder="+229XXXXXXXX"
                  value={phone}
                  disabled={isWaiting}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <Button type="submit" disabled={loading || !canSubmit() || isWaiting} className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white">
                { (loading) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Envoi...
                  </>
                ) : (status === "PENDING" ? ("En attente de confirmation...") :
                  ("Retirer")
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}