import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Wallet, CheckCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import PhoneInput from "react-phone-input-2";
import { createPageUrl, sanitizeMsisdn } from "@/utils";

import { useWithdraw } from "@/hooks/useWithdraw";
import { useAuthContext } from "@/components/common/AuthContext";

export default function Withdraw() {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("MTN_MoMo");
  const [phone, setPhone] = useState("");


  const [submittedTx, setSubmittedTx] = useState(null);
  const { txId, status, loading, error, startWithdraw } = useWithdraw();
  const { user } = useAuthContext();

  useEffect(() => {
    if (user?.phone) setPhone(user.phone);
  }, [user]);

  // helper: parse amount string like "1234.56" or "1234,56" into integer cents
  const parseAmountToCents = (amtStr) => {
    if (!amtStr) return 0;
    const normalized = String(amtStr).replace(/\s+/g, '').replace(',', '.');
    const parts = normalized.split('.');
    const intPart = parts[0] || '0';
    const decPart = (parts[1] || '00').padEnd(2, '0').slice(0,2);
    const cents = parseInt(intPart, 10) * 100 + parseInt(decPart, 10);
    return Number.isNaN(cents) ? 0 : cents;
  };

  // format amount string like "1234.56" -> "1 234,56 €"
  const formatCurrencyFromString = (amtStr) => {
    if (!amtStr) return "";
    const parts = String(amtStr).replace(/\s+/g, '').replace(',', '.').split('.');
    const intPart = parts[0] || '0';
    const decPart = (parts[1] || '00').padEnd(2, '0').slice(0,2);
    const intWithSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${intWithSep},${decPart} €`;
  };

  useEffect(() => {
    if (status === "SUCCESS" && !submittedTx) {
      setSubmittedTx({
        amount,
        recipient_phone: sanitizeMsisdn(phone),
        method,
        txId
      });
    }
  }, [status, submittedTx, amount, phone, method, txId]);

  const fee = () => {
    const cents = parseAmountToCents(amount);
    // 1% fee in cents, min 100 EUR, max 1500 EUR (converted to cents)
    const minFeeCents = 100 * 100;
    const maxFeeCents = 1500 * 100;
    const calculated = Math.round(cents / 100); // cents * 0.01 -> cents/100
    const fCents = Math.min(Math.max(calculated, minFeeCents), maxFeeCents);
    return isNaN(fCents) ? 0 : fCents / 100;
  };

  const canSubmit = () => {
    if (!amount) return false;
    if (method === "MTN_MoMo") {
      return Boolean(phone);
    }
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const msisdn = sanitizeMsisdn(phone);

    if (!user?.id) {
      alert("Utilisateur non authentifié");
      return;
    }

    try {
      if (method === "MTN_MoMo") {
        // send amount as string (backend validates/normalizes)
        await startWithdraw({ userId: user.id, amount: amount, msisdn: msisdn, currency: "EUR" });
      } else {
        alert("Méthode non encore supportée");
      }
    } catch (err) {
      console.error("Erreur retrait:", err);
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
                  {formatCurrencyFromString(submittedTx.amount)}
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
                  type="text"
                  placeholder="Ex: 100.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <p className="text-xs text-neutral-500">
                  Frais estimés: {new Intl.NumberFormat("fr-FR", { style: 'currency', currency: 'EUR' }).format(fee())}
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
                <PhoneInput
                  country={"bj"}
                  value={phone}
                  disabled={true}
                  inputProps={{
                    name: "phone",
                    required: true,
                    readOnly: true,
                  }}
                  inputClass="!w-full !py-2 !text-base !bg-gray-100 !cursor-not-allowed"
                  containerClass="!w-full"
                />
              </div>

              <Button type="submit" disabled={loading || !canSubmit()} className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white">
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