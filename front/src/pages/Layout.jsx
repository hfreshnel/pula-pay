import { Outlet } from 'react-router-dom';
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Home, 
  Wallet, 
  History, 
  MessageSquare, 
  Settings,
  Shield,
  Bell,
  CreditCard,
  Building2
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import SafeComponent from "@/components/common/SafeComponent";
import BrandLogo from "@/components/common/BrandLogo";

const navigationItems = [
  {
    title: "Accueil",
    url: createPageUrl("Dashboard"),
    icon: Home,
  },
  {
    title: "Portefeuille",
    url: createPageUrl("Wallet"),
    icon: Wallet,
  },
  {
    title: "Historique",
    url: createPageUrl("Transactions"),
    icon: History,
  },
  {
    title: "Paiements",
    url: createPageUrl("P2PTransfer"),
    icon: CreditCard,
  },
  {
    title: "Entreprises",
    url: createPageUrl("Bills"),
    icon: Building2,
  },
  // Ajout: Profil
  {
    title: "Profil",
    url: createPageUrl("Profile"),
    icon: Settings,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  return (
    <SafeComponent loadingMessage="Chargement de l'interface...">
      <SidebarProvider>
        <style>{`
          :root {
            --primary-purple: #6366f1;
            --primary-purple-dark: #4f46e5;
            --primary-purple-light: #a5b4fc;
            --secondary-pink: #ec4899;
            --accent-orange: #f59e0b;
            --success-green: #10b981;
            --neutral-50: #f8fafc;
            --neutral-100: #f1f5f9;
            --neutral-200: #e2e8f0;
            --neutral-800: #1e293b;
            --neutral-900: #0f172a;
            --card-shadow: 0 4px 20px rgba(99, 102, 241, 0.08);
            --card-shadow-hover: 0 8px 30px rgba(99, 102, 241, 0.15);
            --brand-green: #2EB67D;
            --brand-orange: #FF6B35;
          }
          
          body {
            font-family: 'Inter', 'Product Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          }
          
          .modern-card {
            background: white;
            border-radius: 20px;
            box-shadow: var(--card-shadow);
            border: 1px solid rgba(148, 163, 184, 0.1);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .modern-card:hover {
            box-shadow: var(--card-shadow-hover);
            transform: translateY(-2px);
          }
          
          .gradient-purple {
            background: linear-gradient(135deg, var(--primary-purple) 0%, var(--primary-purple-dark) 100%);
          }
          
          .gradient-card {
            background: linear-gradient(135deg, var(--primary-purple) 0%, var(--secondary-pink) 100%);
          }
          
          .text-primary {
            color: var(--primary-purple);
          }
          
          .bg-primary {
            background-color: var(--primary-purple);
          }
          
          .animation-slide-up {
            animation: modernSlideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          @keyframes modernSlideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .modern-button {
            background: linear-gradient(135deg, var(--primary-purple) 0%, var(--primary-purple-dark) 100%);
            color: white;
            border: none;
            border-radius: 16px;
            padding: 12px 24px;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
          }
          
          .modern-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
          }
          
          .modern-input {
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 12px 16px;
            font-size: 16px;
            transition: all 0.3s ease;
          }
          
          .modern-input:focus {
            border-color: var(--primary-purple);
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
          }

          /* Anneau dégradé autour du logo */
          .brand-ring {
            background: radial-gradient(120% 120% at 10% 10%, rgba(46,182,125,0.25) 0%, rgba(255,107,53,0.25) 40%, rgba(255,255,255,0.0) 70%);
            border: 1px solid rgba(46,182,125,0.25);
          }
          .shadow-brand {
            box-shadow: 0 6px 18px rgba(46,182,125,0.25), 0 2px 8px rgba(255,107,53,0.18);
          }
          .shadow-brand-strong {
            box-shadow: 0 10px 28px rgba(46,182,125,0.32), 0 6px 16px rgba(255,107,53,0.24);
          }
          
          /* Mobile optimizations */
          @media (max-width: 768px) {
            .mobile-padding {
              padding: 16px;
            }
            
            .mobile-card {
              border-radius: 16px;
              margin: 8px;
            }
          }
        `}</style>
        
        <div className="min-h-screen flex w-full" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
          <ErrorBoundary>
            <Sidebar className="border-r-0 bg-white/90 backdrop-blur-sm hidden md:flex">
              <SidebarHeader className="border-b border-neutral-200/50 p-6">
                <div className="flex items-center gap-3">
                  <BrandLogo size={48} withText />
                </div>
              </SidebarHeader>
              
              <SidebarContent className="p-4">
                <SidebarGroup>
                  <SidebarGroupContent>
                    <SidebarMenu className="space-y-3">
                      {navigationItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton 
                            asChild 
                            className={`hover:bg-violet-50 hover:text-violet-700 transition-all duration-200 rounded-2xl p-4 ${
                              location.pathname === item.url 
                                ? 'gradient-purple text-white shadow-lg shadow-violet-500/25' 
                                : 'text-neutral-600'
                            }`}
                          >
                            <Link to={item.url} className="flex items-center gap-4">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                location.pathname === item.url ? 'bg-white/20' : 'bg-neutral-100'
                              }`}>
                                <item.icon className="w-5 h-5" />
                              </div>
                              <span className="font-semibold">{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup className="mt-8">
                  <div className="px-4">
                    <div className="modern-card p-6 gradient-card">
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="w-5 h-5 text-white" />
                        <span className="text-sm font-semibold text-white">Sécurité</span>
                        <Badge className="bg-white/20 text-white border-white/30 text-xs">
                          Actif
                        </Badge>
                      </div>
                      <p className="text-xs text-white/80 leading-relaxed">
                        Transactions sécurisées par SMS OTP et chiffrement bancaire.
                      </p>
                    </div>
                  </div>
                </SidebarGroup>
              </SidebarContent>

              <SidebarFooter className="border-t border-neutral-200/50 p-4">
                <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-neutral-50 transition-colors">
                  <div className="w-12 h-12 gradient-purple rounded-2xl flex items-center justify-center">
                    <span className="text-white font-semibold">U</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-900 truncate">Utilisateur</p>
                    <p className="text-xs text-neutral-500 truncate">Portefeuille mobile</p>
                  </div>
                  <Bell className="w-5 h-5 text-neutral-400" />
                </div>
              </SidebarFooter>
            </Sidebar>
          </ErrorBoundary>

          <main className="flex-1 flex flex-col">
            <ErrorBoundary>
              {/* Mobile header */}
              <header className="md:hidden bg-white/90 backdrop-blur-sm border-b border-neutral-200/50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BrandLogo size={40} />
                    <h1 className="text-xl font-bold text-neutral-900">Pulapay</h1>
                  </div>
                  <Bell className="w-6 h-6 text-neutral-400" />
                </div>
              </header>

              {/* Mobile bottom navigation */}
              <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-neutral-200/50 px-4 py-2 z-50">
                <div className="flex justify-around items-center">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.title}
                      to={item.url}
                      className={`flex flex-col items-center gap-1 py-2 px-3 rounded-2xl transition-all ${
                        location.pathname === item.url
                          ? 'text-violet-600 bg-violet-50'
                          : 'text-neutral-500'
                      }`}
                    >
                      <item.icon className="w-6 h-6" />
                      <span className="text-xs font-medium">{item.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </ErrorBoundary>

            <div className="flex-1 overflow-auto pb-20 md:pb-0">
              <SafeComponent 
                key={location.pathname} 
                loadingMessage="Chargement de la page..."
                fallback={
                  <div className="min-h-screen p-4 flex items-center justify-center">
                    <div className="w-16 h-16 border-4 border-violet-200 border-t-violet-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-neutral-600">Récupération en cours...</p>
                  </div>
                }
              >
                <ErrorBoundary key={location.pathname}>
                    {/* Use react-router Outlet when this component is used as the element for nested routes.
                      Keep compatibility with explicit children (legacy usage) by falling back to children if Outlet
                      has no content. */}
                    <Outlet />
                </ErrorBoundary>
              </SafeComponent>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </SafeComponent>
  );
}

