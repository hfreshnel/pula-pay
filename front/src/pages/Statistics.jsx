import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function StatisticsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [availableMonths, setAvailableMonths] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  /*useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedMonth && currentUser) {
      loadAnalysisForMonth(selectedMonth);
    }
  }, [selectedMonth, currentUser]);

  const loadData = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      const analyses = await UserAnalysis.filter({ user_id: user.email }, "-analysis_month");
      const months = analyses.map(a => a.analysis_month).filter(Boolean);
      setAvailableMonths(months);
      
      if (months.length > 0 && !selectedMonth) {
        setSelectedMonth(months[0]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
    }
    setIsLoading(false);
  };*/

  /*const loadAnalysisForMonth = async (month) => {
    try {
      const analyses = await UserAnalysis.filter({ 
        user_id: currentUser.email, 
        analysis_month: month 
      });
      setAnalysis(analyses[0] || null);
    } catch (error) {
      console.error("Erreur lors du chargement de l'analyse:", error);
    }
  };*/

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount || 0);
  };

  const getBarChartData = () => {
    if (!analysis?.category_breakdown) return [];
    
    return Object.entries(analysis.category_breakdown).map(([key, value]) => ({
      name: key.replace(/_/g, ' '),
      value: Number(value || 0),
      revenue: key.includes('topup') ? Number(value || 0) : 0,
      expense: !key.includes('topup') ? Number(value || 0) : 0
    }));
  };

  const getPieChartData = () => {
    if (!analysis?.operator_breakdown) return [];
    
    return Object.entries(analysis.operator_breakdown)
      .filter(([_, value]) => Number(value || 0) > 0)
      .map(([key, value]) => ({
        name: key,
        value: Number(value || 0)
      }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-white p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Statistiques</h1>
            <p className="text-neutral-600">Analysez vos habitudes financières</p>
          </div>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Mois" />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map(month => (
                <SelectItem key={month} value={month}>{month}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="card-glow border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Solde Total</p>
                  <p className="text-2xl font-bold text-neutral-900">
                    {formatAmount(currentUser?.wallet_balance || 0)} XOF
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-glow border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Revenus</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {formatAmount(analysis?.total_revenue || 0)} XOF
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                  <ArrowUpRight className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-glow border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Dépenses</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatAmount(analysis?.total_expenses || 0)} XOF
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center">
                  <ArrowDownRight className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-glow border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Économies</p>
                  <p className={`text-2xl font-bold ${(analysis?.total_savings || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatAmount(analysis?.total_savings || 0)} XOF
                  </p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-r rounded-2xl flex items-center justify-center ${(analysis?.total_savings || 0) >= 0 ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600'}`}>
                  {(analysis?.total_savings || 0) >= 0 ? 
                    <TrendingUp className="w-6 h-6 text-white" /> : 
                    <TrendingDown className="w-6 h-6 text-white" />
                  }
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <Card className="card-glow border-0">
            <CardHeader>
              <CardTitle>Répartition par catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getBarChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${formatAmount(value)} XOF`]} />
                    <Bar dataKey="expense" fill="#8b5cf6" />
                    <Bar dataKey="revenue" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card className="card-glow border-0">
            <CardHeader>
              <CardTitle>Répartition par opérateur</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getPieChartData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {getPieChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${formatAmount(value)} XOF`]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {getPieChartData().map((entry, index) => (
                  <Badge key={entry.name} variant="outline" className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    {entry.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights */}
        {analysis?.insights && (
          <Card className="card-glow border-0">
            <CardHeader>
              <CardTitle>Insights & Recommandations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-neutral-50 rounded-xl p-4">
                  <p className="text-sm text-neutral-600">Catégorie principale</p>
                  <p className="font-semibold text-neutral-900">{analysis.insights.top_spending_category?.replace(/_/g, ' ')}</p>
                </div>
                <div className="bg-neutral-50 rounded-xl p-4">
                  <p className="text-sm text-neutral-600">Tendance</p>
                  <p className="font-semibold text-neutral-900">{analysis.insights.spending_trend}</p>
                </div>
                <div className="bg-neutral-50 rounded-xl p-4">
                  <p className="text-sm text-neutral-600">Taux d'épargne</p>
                  <p className="font-semibold text-neutral-900">{(analysis.insights.savings_rate || 0).toFixed(1)}%</p>
                </div>
              </div>
              
              {analysis.insights.recommendations && analysis.insights.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-neutral-900 mb-2">Recommandations</h4>
                  <ul className="space-y-2">
                    {analysis.insights.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-center gap-2 text-neutral-700">
                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}