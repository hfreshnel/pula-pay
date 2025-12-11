import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, Activity, AlertCircle, Bell, Gift, Users, PieChart } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import SafeComponent, { useSafeAsync } from "../components/common/SafeComponent";
import QuickActions from "../components/dashboard/QuickActions";
import WalletSummary from "../components/dashboard/WalletSummary";
import RecentTransactions from "../components/dashboard/RecentTransactions";

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Chargement sécurisé des données avec protection d'erreur
  const { data: userData, loading: userLoading, error: userError, refetch: refetchUser } = useSafeAsync(async () => {
    
  }, []);

  const { data: transactionData, loading: transactionLoading, refetch: refetchTransactions } = useSafeAsync(async () => {
    
  }, [userData]);

  const { data: serviceData, loading: serviceLoading, refetch: refetchServices } = useSafeAsync(async () => {
    
  }, []);

  useEffect(() => {
    if (userData) setCurrentUser(userData);
    if (transactionData) setTransactions(transactionData);
    if (serviceData) setServices(serviceData);
    
    const allLoaded = !userLoading && !transactionLoading && !serviceLoading;
    setIsLoading(!allLoaded);
    setError(userError);
  }, [userData, transactionData, serviceData, userLoading, transactionLoading, serviceLoading, userError]);

  const handleRetry = () => {
    refetchUser();
    refetchTransactions();
    refetchServices();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-200 border-t-violet-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Chargement de PulaPay...</p>
        </div>
      </div>
    );
  }

  if (error && !currentUser) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Card className="modern-card max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Problème de connexion</h3>
            <p className="text-neutral-600 mb-4">
              Impossible de charger vos données. Vérifiez votre connexion internet.
            </p>
            <Button onClick={handleRetry} className="modern-button">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header moderne */}
        <SafeComponent>
          <div className="mb-8 animation-slide-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl md:text-4xl font-bold text-neutral-900">
                    Bonjour 👋
                  </h1>
                  <Badge className="bg-violet-50 text-violet-700 border-violet-200">
                    <Activity className="w-3 h-3 mr-1" />
                    En ligne
                  </Badge>
                </div>
                <p className="text-neutral-600">
                  {new Date().toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    day: 'numeric',
                    month: 'long'
                  })}
                </p>
              </div>
              <Button variant="outline" className="rounded-2xl border-neutral-200">
                <Bell className="w-4 h-4 mr-2 text-neutral-500" />
                Notifications
              </Button>
            </div>
          </div>
        </SafeComponent>

        {/* Message d'erreur non bloquant */}
        {error && currentUser && (
          <SafeComponent>
            <Card className="mb-6 border-orange-200 bg-orange-50 modern-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <span className="text-orange-800 text-sm">
                    Certaines données n'ont pas pu être chargées. {" "}
                    <Button variant="link" className="p-0 h-auto text-orange-600" onClick={handleRetry}>
                      Réessayer
                    </Button>
                  </span>
                </div>
              </CardContent>
            </Card>
          </SafeComponent>
        )}

        {/* Résumé du portefeuille moderne */}
        <SafeComponent>
          <div className="mb-8">
            <WalletSummary />
          </div>
        </SafeComponent>

        {/* Actions rapides avec nouveau design */}
        <SafeComponent>
          <div className="mb-8">
            <QuickActions />
          </div>
        </SafeComponent>

        {/* Promo card moderne */}
        <SafeComponent>
          <Card className="modern-card mb-8 overflow-hidden animation-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="gradient-card p-6 text-white relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Offre spéciale</h3>
                    <p className="text-white/80 text-sm">5% de réduction sur les recharges aujourd'hui</p>
                  </div>
                </div>
                <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-xl">
                  Profiter
                </Button>
              </div>
            </div>
          </Card>
        </SafeComponent>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Transactions récentes avec nouveau style */}
          <SafeComponent>
            <div className="lg:col-span-2">
              <RecentTransactions />
            </div>
          </SafeComponent>

          {/* Panel latéral moderne */}
          <SafeComponent>
            <div className="space-y-6">
              {/* Stats rapides */}
              <Card className="modern-card animation-slide-up" style={{ animationDelay: '0.5s' }}>
                <CardHeader>
                  <CardTitle className="text-lg">Activité ce mois</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600 text-sm">Transactions</span>
                    <span className="font-bold text-violet-600">{transactions.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600 text-sm">Total dépensé</span>
                    <span className="font-bold text-emerald-600">
                      {new Intl.NumberFormat('fr-FR').format(
                        transactions.reduce((sum, t) => sum + (t.amount || 0), 0)
                      )} XOF
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full h-2">
                    <div className="bg-gradient-to-r from-violet-500 to-purple-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                  <p className="text-xs text-neutral-500">65% de votre budget mensuel</p>
                </CardContent>
              </Card>

              {/* Liens rapides */}
              <Card className="modern-card animation-slide-up" style={{ animationDelay: '0.6s' }}>
                <CardHeader>
                  <CardTitle className="text-lg">Accès rapide</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link to={createPageUrl("Contacts")} className="block">
                    <Button variant="ghost" className="w-full justify-start rounded-xl hover:bg-violet-50 hover:text-violet-700">
                      <Users className="w-4 h-4 mr-3" />
                      Mes contacts
                    </Button>
                  </Link>
                  <Link to={createPageUrl("Statistics")} className="block">
                    <Button variant="ghost" className="w-full justify-start rounded-xl hover:bg-violet-50 hover:text-violet-700">
                      <PieChart className="w-4 h-4 mr-3" />
                      Statistiques
                    </Button>
                  </Link>
                  <Link to={createPageUrl("Receipts")} className="block">
                    <Button variant="ghost" className="w-full justify-start rounded-xl hover:bg-violet-50 hover:text-violet-700">
                      <Receipt className="w-4 h-4 mr-3" />
                      Mes reçus
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </SafeComponent>
        </div>
      </div>
    </div>
  );
}