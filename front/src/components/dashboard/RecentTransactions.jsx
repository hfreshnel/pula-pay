import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Smartphone,
  Wifi,
  Send,
  Receipt
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuthContext } from "@/components/common/AuthContext";
import { useTransactions } from "@/hooks/useTransactions";

const getTransactionIcon = (kind) => {
  // entry kinds: DEPOSIT, WITHDRAWAL, TRANSFER, REFUND, FEE, ADJUSTMENT
  const iconMap = {
    DEPOSIT: ArrowDownRight,
    WITHDRAWAL: ArrowUpRight,
    TRANSFER: Send,
    REFUND: ArrowDownRight,
    FEE: Receipt,
    ADJUSTMENT: MoreHorizontal
  };

  return iconMap[String(kind).toUpperCase()] || ArrowUpRight;
};

const getStatusColor = (status) => {
  switch (status) {
    case "completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "pending":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "failed":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-neutral-50 text-neutral-700 border-neutral-200";
  }
};

const getTransactionGradient = (kind) => {
  const gradients = {
    DEPOSIT: "from-emerald-400 to-emerald-600",
    WITHDRAWAL: "from-red-400 to-red-600",
    TRANSFER: "from-green-400 to-green-600",
    REFUND: "from-blue-400 to-blue-600",
    FEE: "from-yellow-400 to-orange-500",
    ADJUSTMENT: "from-indigo-400 to-indigo-600"
  };
  return gradients[String(kind).toUpperCase()] || "from-neutral-400 to-neutral-600";
};

const formatTransactionType = (kind) => {
  const types = {
    DEPOSIT: "Dépôt",
    WITHDRAWAL: "Retrait",
    TRANSFER: "Transfert",
    REFUND: "Remboursement",
    FEE: "Frais",
    ADJUSTMENT: "Ajustement"
  };
  return types[String(kind).toUpperCase()] || String(kind);
};

export default function RecentTransactions({ transactions: transactionsProp }) {
  // prefer hook-provided transactions, fallback to prop
  const { user } = useAuthContext();
  const { transactions: hookTxs, loading, error, getTransactions } = useTransactions();

  // load transactions for the logged-in user
  const userId = user?.id;
  React.useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        await getTransactions(userId);
      } catch (e) {
        // handled by hook
      }
    })();
  }, [userId, getTransactions]);

  const source = Array.isArray(hookTxs) && hookTxs.length ? hookTxs : (Array.isArray(transactionsProp) ? transactionsProp : []);

  // create a safe array and sort by createdAt/created_date desc
  const safeTransactions = Array.from(source).sort((a, b) => {
    const aDate = a?.createdAt ? new Date(a.createdAt) : (a?.created_date ? new Date(a.created_date) : new Date(0));
    const bDate = b?.createdAt ? new Date(b.createdAt) : (b?.created_date ? new Date(b.created_date) : new Date(0));
    return bDate - aDate;
  });
  
  if (safeTransactions.length === 0) {
    return (
      <Card className="modern-card">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-neutral-900">Transactions récentes</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ArrowUpRight className="w-8 h-8 text-violet-400" />
          </div>
          <h3 className="font-bold text-neutral-900 mb-2">Aucune transaction</h3>
          <p className="text-neutral-500 text-sm mb-4">
            Vos transactions récentes apparaîtront ici
          </p>
          <Link to={createPageUrl("Recharge")}>
            <Button className="modern-button">
              Première transaction
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="modern-card animation-slide-up" style={{ animationDelay: '0.4s' }}>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-bold text-neutral-900">Activité récente</CardTitle>
        <Link to={createPageUrl("Transactions")}>
          <Button variant="ghost" className="text-violet-600 hover:text-violet-700 text-sm font-medium">
            Voir tout
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-0">
          {safeTransactions.slice(0, 3).map((transaction, index) => {
            if (!transaction?.id) return null;
            
                const IconComponent = getTransactionIcon(transaction.kind);
                const transactionDate = transaction.createdAt ? new Date(transaction.createdAt) : (transaction.created_date ? new Date(transaction.created_date) : new Date());
                const gradient = getTransactionGradient(transaction.kind);
            
            return (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors duration-200 border-b last:border-b-0 border-neutral-100/50 group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900 text-sm">
                      {formatTransactionType(transaction.kind)}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-neutral-500">
                        {format(transactionDate, "dd MMM HH:mm", { locale: fr })}
                      </p>
                      {(transaction.operator || (transaction.meta && transaction.meta.operator)) && (
                        <Badge variant="outline" className="text-xs px-2 py-0.5">
                          {transaction.operator || (transaction.meta && transaction.meta.operator)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                    <p className="font-bold text-neutral-900 text-sm">
                    {new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 6 }).format(Number(transaction.amount || 0))} {transaction.currency || 'XOF'}
                  </p>
                  <Badge className={`${getStatusColor(String(transaction.status || '').toLowerCase())} border text-xs mt-1`}>
                    {String(transaction.status || '').toLowerCase()}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}