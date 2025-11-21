import React, { useEffect, useState } from "react";
import { User, Transaction } from "@/api/entities";
import WalletSummary from "../components/dashboard/WalletSummary";
import RecentTransactions from "../components/dashboard/RecentTransactions";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus } from "lucide-react";

export default function WalletPage() {
  const [me, setMe] = useState(null);
  const [transactions, setTransactions] = useState([]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <WalletSummary />
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Activité du portefeuille</h2>
          <Link to={createPageUrl("TopUp")}><Button className="bg-gradient-to-r from-orange-500 to-red-500 text-white"><Plus className="w-4 h-4 mr-2" /> Recharger</Button></Link>
        </div>
        <RecentTransactions transactions={transactions} />
      </div>
    </div>
  );
}