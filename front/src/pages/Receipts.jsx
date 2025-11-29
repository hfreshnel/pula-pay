import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Share2, Filter, FileText, CheckCircle, XCircle, Clock } from "lucide-react";

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState([]);
  const [filteredReceipts, setFilteredReceipts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  /*useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterReceipts();
  }, [receipts, searchQuery, statusFilter, typeFilter]);

  const loadData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      // Charger les transactions de l'utilisateur
      const userTransactions = await Transaction.filter({ created_by: user.email }, "-created_date");
      setTransactions(userTransactions);
      
      // Charger les reçus existants
      const userReceipts = await Receipt.filter({ user_id: user.email }, "-created_date");
      setReceipts(userReceipts);
      
      // Générer des reçus pour les transactions qui n'en ont pas
      await generateMissingReceipts(userTransactions, userReceipts, user.email);
      
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
    }
    setIsLoading(false);
  };*/

  const generateMissingReceipts = async (transactions, existingReceipts, userId) => {
    // Identifier les transactions sans reçu
    /*const existingTransactionIds = new Set(existingReceipts.map(r => r.transaction_id));
    const missingReceipts = transactions.filter(t => 
      t.status === "completed" && !existingTransactionIds.has(t.id)
    );

    // Générer les reçus manquants
    for (const transaction of missingReceipts) {
      try {
        const receiptData = {
          transaction_id: transaction.id,
          user_id: userId,
          receipt_number: `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          transaction_type: transaction.type,
          amount: transaction.amount,
          fee: transaction.fee || 0,
          total_amount: (transaction.amount || 0) + (transaction.fee || 0),
          currency: "XOF",
          recipient_info: {
            name: transaction.recipient_name,
            phone: transaction.recipient_phone,
            account: transaction.recipient_user_id
          },
          payment_method: transaction.payment_method || "wallet",
          operator: transaction.operator,
          status: "completed",
          receipt_data: {
            merchant_info: {
              name: "PulaPay",
              address: "Cotonou, Bénin",
              phone: "+229 XX XX XX XX"
            },
            terminal_id: "PLP001",
            auth_code: Math.random().toString(36).substr(2, 9).toUpperCase()
          },
          is_shared: false
        };

        await Receipt.create(receiptData);
      } catch (error) {
        console.error(`Erreur lors de la création du reçu pour ${transaction.id}:`, error);
      }
    }

    // Recharger les reçus après génération
    if (missingReceipts.length > 0) {
      const updatedReceipts = await Receipt.filter({ user_id: userId }, "-created_date");
      setReceipts(updatedReceipts);
    }*/
  };

  const filterReceipts = () => {
    let filtered = [...receipts];

    // Filtre par recherche
    if (searchQuery) {
      filtered = filtered.filter(receipt => 
        receipt.receipt_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        receipt.recipient_info?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        receipt.operator?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtre par statut
    if (statusFilter !== "all") {
      filtered = filtered.filter(receipt => receipt.status === statusFilter);
    }

    // Filtre par type
    if (typeFilter !== "all") {
      filtered = filtered.filter(receipt => receipt.transaction_type === typeFilter);
    }

    setFilteredReceipts(filtered);
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount || 0);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case "failed": return <XCircle className="w-4 h-4 text-red-600" />;
      case "pending": return <Clock className="w-4 h-4 text-orange-600" />;
      default: return <Clock className="w-4 h-4 text-neutral-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "failed": return "bg-red-50 text-red-700 border-red-200";
      case "pending": return "bg-orange-50 text-orange-700 border-orange-200";
      default: return "bg-neutral-50 text-neutral-700 border-neutral-200";
    }
  };

  const getTransactionTypeLabel = (type) => {
    const labels = {
      recharge_credit: "Recharge crédit",
      recharge_data: "Forfait Internet",
      transfer_money: "Transfert",
      bill_payment: "Facture",
      wallet_topup: "Recharge portefeuille",
      p2p_transfer: "Transfert PulaPay",
      wallet_withdrawal: "Retrait portefeuille"
    };
    return labels[type] || type;
  };

  const downloadReceipt = (receipt) => {
    // Simuler le téléchargement du reçu
    const receiptContent = `
PULAPAY - REÇU DE TRANSACTION
================================

Numéro de reçu: ${receipt.receipt_number}
Date: ${new Date(receipt.created_date).toLocaleDateString('fr-FR')}
Type: ${getTransactionTypeLabel(receipt.transaction_type)}
Opérateur: ${receipt.operator || 'N/A'}

DÉTAILS FINANCIERS
------------------
Montant: ${formatAmount(receipt.amount)} XOF
Frais: ${formatAmount(receipt.fee)} XOF
Total: ${formatAmount(receipt.total_amount)} XOF

BÉNÉFICIAIRE
------------
Nom: ${receipt.recipient_info?.name || 'N/A'}
Téléphone: ${receipt.recipient_info?.phone || 'N/A'}

INFORMATIONS TECHNIQUES
-----------------------
Terminal: ${receipt.receipt_data?.terminal_id || 'N/A'}
Code d'autorisation: ${receipt.receipt_data?.auth_code || 'N/A'}
Statut: ${receipt.status}

Merci d'utiliser PulaPay !
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt_${receipt.receipt_number}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareReceipt = async (receipt) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Reçu PulaPay - ${receipt.receipt_number}`,
          text: `Reçu de transaction PulaPay\nMontant: ${formatAmount(receipt.total_amount)} XOF\nDate: ${new Date(receipt.created_date).toLocaleDateString('fr-FR')}`,
        });
      } catch (error) {
        console.log('Partage annulé');
      }
    } else {
      // Fallback: copier dans le presse-papiers
      const text = `Reçu PulaPay - ${receipt.receipt_number}\nMontant: ${formatAmount(receipt.total_amount)} XOF\nDate: ${new Date(receipt.created_date).toLocaleDateString('fr-FR')}`;
      navigator.clipboard.writeText(text);
      alert('Reçu copié dans le presse-papiers !');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-white p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Génération des reçus...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Reçus</h1>
            <p className="text-neutral-600">Consultez et téléchargez vos reçus de transaction</p>
          </div>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            {filteredReceipts.length} reçu{filteredReceipts.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Filtres */}
        <Card className="card-glow border-0">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <Input
                  placeholder="Rechercher un reçu..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-neutral-400" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="completed">Complété</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="failed">Échoué</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-neutral-400" />
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="recharge_credit">Recharge crédit</SelectItem>
                    <SelectItem value="recharge_data">Forfait Internet</SelectItem>
                    <SelectItem value="transfer_money">Transfert</SelectItem>
                    <SelectItem value="bill_payment">Facture</SelectItem>
                    <SelectItem value="wallet_topup">Recharge portefeuille</SelectItem>
                    <SelectItem value="p2p_transfer">Transfert PulaPay</SelectItem>
                    <SelectItem value="wallet_withdrawal">Retrait</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des reçus */}
        <Card className="card-glow border-0">
          <CardContent className="p-0">
            {filteredReceipts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-neutral-400" />
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2">
                  {searchQuery ? "Aucun reçu trouvé" : "Aucun reçu disponible"}
                </h3>
                <p className="text-neutral-500">
                  {searchQuery ? "Essayez un autre terme de recherche" : "Vos reçus de transaction apparaîtront ici"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {filteredReceipts.map(receipt => (
                  <div key={receipt.id} className="p-6 hover:bg-neutral-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl flex items-center justify-center">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-neutral-900">
                              {getTransactionTypeLabel(receipt.transaction_type)}
                            </h3>
                            <Badge className={`${getStatusColor(receipt.status)} border text-xs`}>
                              {receipt.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-neutral-500">
                            <span>Reçu #{receipt.receipt_number}</span>
                            <span>{new Date(receipt.created_date).toLocaleDateString('fr-FR')}</span>
                            {receipt.operator && (
                              <Badge variant="outline" className="text-xs">
                                {receipt.operator}
                              </Badge>
                            )}
                          </div>
                          {receipt.recipient_info?.name && (
                            <p className="text-sm text-neutral-600 mt-1">
                              Vers: {receipt.recipient_info.name}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-bold text-neutral-900 mb-1">
                          {formatAmount(receipt.total_amount)} XOF
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadReceipt(receipt)}
                            className="text-neutral-500 hover:text-blue-600"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => shareReceipt(receipt)}
                            className="text-neutral-500 hover:text-emerald-600"
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}