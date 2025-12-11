import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, User as UserIcon, Users, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PhoneInput from "react-phone-input-2";

import { useRecipientId } from "@/hooks/useRecipientId";
import { useTransfer } from "@/hooks/useTransfer";
import { useAuthContext } from "@/components/common/AuthContext";

export default function P2PTransfer() {
  const [queryPhone, setQueryPhone] = useState("");
  const [recipientPhone, setRecipientPhone] = useState(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submittedTx, setSubmittedTx] = useState(null);
  const [ackTxId, setAckTxId] = useState(null);

  const { recipientId, error: getPhoneUserIdError, getPhoneUserId } = useRecipientId();
  const { txId, status, loading, error, startTransfer } = useTransfer();
  const { user } = useAuthContext();
  const userId = user?.id;

  // format amount string like "1234.56" -> "1 234,56 €"
  const formatCurrencyFromString = (amtStr) => {
    if (amtStr == null) return "";
    const parts = String(amtStr).replace(/\s+/g, '').replace(',', '.').split('.');
    const intPart = parts[0] || '0';
    const decPart = (parts[1] || '00').padEnd(2, '0').slice(0,2);
    const intWithSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${intWithSep},${decPart} €`;
  };

  useEffect(() => {
    if (!userId || !queryPhone) return;
    const handler = setTimeout(() => {
      getPhoneUserId(userId, queryPhone.trim());
    }, 400);
    return () => clearTimeout(handler);
  }, [userId, queryPhone, getPhoneUserId]);

  useEffect(() => {
    if (status === "SUCCESS" && txId && txId !== ackTxId) {
      setSubmittedTx({
        amount,
        recipientPhone: recipientPhone,
        txId
      });
      setAckTxId(txId);
    }
  }, [status, submittedTx, amount, recipientPhone, txId, ackTxId]);

  const quickAmounts = [1000, 2000, 5000, 10000, 20000];

  // auto-select beneficiary when recipientId becomes available
  useEffect(() => {
    if (recipientId && !recipientPhone && queryPhone) {
      setRecipientPhone(queryPhone.trim());
    }
  }, [recipientId, queryPhone, recipientPhone]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recipientPhone || !amount || !recipientId || !userId) return;

    try {
      await startTransfer({
        senderId: userId,
        receiverId: recipientId,
        amount: String(amount),
        currency: "EUR",
        note
      });
    } catch (err) {
      console.error("Transfer error:", err);
    }
  };

  const handleSelectRecipient = () => {
    if (recipientId) {
      setRecipientPhone(queryPhone.trim());
    }
  }

  if (submittedTx) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-white p-4 md:p-8">
        <div className="max-w-xl mx-auto">
          <Card className="card-glow border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                Transfert P2P éffectué
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-neutral-500">Bénéficiaire</div>
                <div className="font-medium">{recipientPhone}</div>
                <div className="text-neutral-500">Montant</div>
                <div className="font-medium">{formatCurrencyFromString(submittedTx.amount)}</div>
                <div className="text-neutral-500">Référence</div>
                <div className="font-mono">{submittedTx.txId}</div>
                <div className="text-neutral-500">Statut</div>
                <div><Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">pending</Badge></div>
              </div>
              <div className="flex gap-3">
                <Link to={createPageUrl("Transactions")}><Button variant="outline">Voir transactions</Button></Link>
                <Button
                  onClick={() => {
                    // reset local page state for a fresh transfer
                    setSubmittedTx(null);
                    setAmount("");
                    setNote("");
                    setRecipientPhone(null);
                    setQueryPhone("");
                    // acknowledge this txId so effect won't recreate submittedTx while status===SUCCESS
                    setAckTxId(txId);
                  }} className="bg-gradient-to-r from-orange-500 to-red-500 text-white">Nouveau transfert</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="outline" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <h1 className="text-2xl font-bold">Transfert PulaPay → PulaPay</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="card-glow border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Choisir le bénéficiaire
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Label>Numéro du bénéficiaire</Label>
              <PhoneInput
                country={"bj"}
                value={queryPhone}
                onChange={(value) => setQueryPhone(value)}
                inputProps={{ name: 'phone' }}
                inputClass="!w-full !py-2 !text-base"
                containerClass="!w-full"
              />
              {recipientId && !getPhoneUserIdError ? (
                <div className="p-3 border rounded-xl bg-neutral-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-neutral-200 flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-neutral-600" />
                      </div>
                      <div>
                        <div className="font-medium">Utilisateur trouvé</div>
                        <div className="text-sm text-neutral-600">{queryPhone}</div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSelectRecipient}
                    >
                      {recipientPhone === queryPhone ? "Sélectionné" : "Sélectionner"}
                    </Button>
                  </div>
                </div>
              ) : (
                queryPhone && getPhoneUserIdError && (
                  <p className="text-xs text-red-500">{getPhoneUserIdError}</p>
                )
              )}
            </CardContent>
          </Card>

          <Card className="card-glow border-0">
            <CardHeader>
              <CardTitle>Détails du transfert</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-2">
                <Label>Montant (EUR)</Label>
                <Input type="number" min="100" step="50" placeholder="Ex: 2000" value={amount} onChange={(e) => setAmount(e.target.value)} />
                <div className="flex flex-wrap gap-2 pt-1">
                  {quickAmounts.map(v => (
                    <Button key={v} type="button" variant="outline" size="sm" onClick={() => setAmount(String(v))}>
                      {new Intl.NumberFormat('fr-FR').format(v)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Message (optionnel)</Label>
                <Input placeholder="Ex: Participation, cadeau..." value={note} onChange={(e) => setNote(e.target.value)} />
              </div>

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                  Erreur: {error}
                </div>
              )}

              <Button
                type="button"
                disabled={loading || !recipientPhone || !amount}
                onClick={handleSubmit}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  "Envoyer l'argent"
                )}
              </Button>

              {recipientPhone && (
                <div className="text-xs text-neutral-600">
                  Envoi à <span className="font-medium">{recipientPhone}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}