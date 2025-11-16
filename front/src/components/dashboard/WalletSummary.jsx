import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Wallet, Plus, ArrowUpRight, Eye, EyeOff, ArrowDownRight, TrendingUp, Loader2, RotateCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import { useAuthContext } from '../common/AuthContext';
import { useBalance } from '@/hooks/useBalance';

export default function WalletSummary() {
  const [showBalance, setShowBalance] = useState(true);
  const { balance, loading, error, getBalance } = useBalance();

  const { user } = useAuthContext();
  console.log(`user: ${user.id}`);

  //const userId = user?.userId || "d9c5a0b2-0f7c-4f3b-9a86-3f8f57b0b2a1";
  const userId = user?.id;
  const currency = "EUR";

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));
  };

  useEffect(() => {
    if (!userId) return;
    (async () => {
      await getBalance(userId, currency);
    })();
  }, [userId, currency, getBalance]);

  const maskedOrValue = useMemo(() => {
    if (!showBalance) return "••••••";
    if (balance === null) return "--";
    return formatAmount(balance);
  }, [showBalance, balance]);

  return (
    <div className="modern-card p-0 overflow-hidden animation-slide-up">
      {/* Header avec gradient violet */}
      <div className="gradient-card p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium">Solde disponible</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-white/20 text-white border-white/30 text-xs">
                    Vérifié ✓
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl"
                onClick={() => setShowBalance(!showBalance)}
              >
                {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl"
                //onClick={() => userId && getBalance(userId, currency)}
                title="Rafraîchir"
              //disabled={!userId || loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RotateCw className="w-5 h-5" />}
              </Button>
            </div>

          </div>

          <div className="mb-6">
            <div className="flex items-baseline gap-2 mb-2 min-h-[44px]">
              {error ? (
                <span className="text-red-200 text-sm">{error}</span>
              ) : loading && balance === null ? (
                <span className="inline-block h-10 w-40 bg-white/20 rounded-lg animate-pulse" />
              ) : (
                <>
                  <span className="text-4xl font-bold text-white">{maskedOrValue}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-300" />
              <span className="text-white/80 text-sm">+2.5% ce mois</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link to={createPageUrl("TopUp")} className="block">
            <Button className="w-full modern-button flex items-center justify-center gap-2 h-14">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <span className="font-semibold">Recharger</span>
            </Button>
          </Link>

          <Link to={createPageUrl("P2PTransfer")} className="block">
            <Button className="w-full h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 hover:-translate-y-0.5">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center mr-2">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <span className="font-semibold">Envoyer</span>
            </Button>
          </Link>

          <Link to={createPageUrl("Withdraw")} className="block">
            <Button className="w-full h-14 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl shadow-lg shadow-orange-500/25 transition-all hover:shadow-orange-500/40 hover:-translate-y-0.5">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center mr-2">
                <ArrowDownRight className="w-5 h-5" />
              </div>
              <span className="font-semibold">Retirer</span>
            </Button>
          </Link>
        </div>

        <div className="mt-4 text-center">
          <Link to={createPageUrl("Wallet")}>
            <Button variant="ghost" className="text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-xl">
              Voir les détails
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}