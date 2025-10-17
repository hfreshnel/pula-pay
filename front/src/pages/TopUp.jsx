import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Wallet, CreditCard, CheckCircle, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import { useDeposit } from "@/hooks/useDeposit";

function sanitizeMsisdn(v) {
  return String(v).replace(/[^\d]/g, "");
}

export default function TopUp() {
  const [method, setMethod] = useState("MTN_MoMo");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [isWaiting, setIsWaiting] = useState(false);

  const [submittedTx, setSubmittedTx] = useState(null);
  const { txId, status, loading, error, startDeposit } = useDeposit();

  useEffect(() => {
    if (status === "SUCCESS" && !submittedTx) {
      setIsWaiting(false);
      setSubmittedTx({
        amount,
        recipient_phone: sanitizeMsisdn(phone),
        method,
        txId
      });
    }
  }, [status, submittedTx, amount, phone, method, txId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsWaiting(true);
    const msisdn = sanitizeMsisdn(phone);

    //const operator = method.includes("MTN") ? "MTN" : method.includes("Moov") ? "Moov" : undefined;
    if (method === "MTN_MoMo") {
      await startDeposit({ userId: "d9c5a0b2-0f7c-4f3b-9a86-3f8f57b0b2a1", amount: String(amount), msisdn: msisdn, currency: "EUR" });
    } else {
      alert("Méthode non encore supportée");
    }
  };

  const canUpdate = () => {
    return (status === null);
  }

  const canSubmit = () => {
    if (!canUpdate()) return false;
    if (!amount) return false;
    return Boolean(phone && amount);
  };

  if (submittedTx) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-white p-4 md:p-8">
        <div className="max-w-xl mx-auto">
          <Card className="card-glow border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                Recharge portefeuille effectué
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
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Recharger le portefeuille</h1>
        </div>
        <Card className="card-glow border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              "Via MoMo ou Moov Money"
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-2">
                <Label>Méthode</Label>
                <Select value={method} onValueChange={setMethod} disabled={isWaiting}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MTN_MoMo">MTN MoMo</SelectItem>
                    <SelectItem value="Moov_Money">Moov Money</SelectItem>
                    <SelectItem value="Card_Visa">Carte Visa</SelectItem>
                    <SelectItem value="Card_Mastercard">Mastercard</SelectItem>
                    <SelectItem value="Card_Amex">American Express</SelectItem>
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

              <div className="grid gap-2">
                <Label>Montant (EUR)</Label>
                <Input
                  type="number"
                  min="500"
                  step="100"
                  placeholder="Ex: 10000"
                  value={amount}
                  disabled={isWaiting}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !canSubmit() || isWaiting}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Envoi...
                  </>
                ) : (status === "PENDING" ? ("En attente de confirmation...") :
                  ("Recharger")
                )}
              </Button>

              {error && <div className="text-sm text-red-600 mt-2">{String(error)}</div>}
              {txId && <div className="text-xs text-neutral-500 mt-1">txId: <code>{txId}</code> • statut: {status || "—"}</div>}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}