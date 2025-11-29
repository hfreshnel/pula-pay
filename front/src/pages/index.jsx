import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Assistant from "./Assistant";

import Recharge from "./Recharge";

import Internet from "./Internet";

import Transfer from "./Transfer";

import Bills from "./Bills";

import TopUp from "./TopUp";

import Transactions from "./Transactions";

import Wallet from "./Wallet";

import P2PTransfer from "./P2PTransfer";

import Withdraw from "./Withdraw";

import Analysis from "./Analysis";

import Statistics from "./Statistics";

import Contacts from "./Contacts";

import Receipts from "./Receipts";

import Profile from "./Profile";

import Register from "./Register";

import Login from "./Login";

import ProtectedRoute from "../components/common/ProtectedRoute";

import { useAuthContext } from "@/components/common/AuthContext.jsx";

import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';



const PAGES = {
    Login: Login,
    Register: Register,
    Dashboard: Dashboard,
    Assistant: Assistant,
    Recharge: Recharge,
    Internet: Internet,
    Transfer: Transfer,
    Bills: Bills,
    TopUp: TopUp,
    Transactions: Transactions,
    Wallet: Wallet,
    P2PTransfer: P2PTransfer,
    Withdraw: Withdraw,
    Analysis: Analysis,
    Statistics: Statistics,
    Contacts: Contacts,
    Receipts: Receipts,
    Profile: Profile,
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || "Dashboard";
}

function RootRedirect() {
    const { isAuthenticated, isLoading } = useAuthContext();

    return isAuthenticated 
        ? <Navigate to="/dashboard" replace />
        : <Navigate to="/login" replace />;
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);

    return (
        <Routes>
            <Route path="/" element={<RootRedirect />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<Layout currentPageName={currentPage} />}>

                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                } />

                <Route path="/assistant" element={
                    <ProtectedRoute>
                        <Assistant />
                    </ProtectedRoute>
                } />

                <Route path="/recharge" element={
                    <ProtectedRoute>
                        <Recharge />
                    </ProtectedRoute>
                } />

                <Route path="/internet" element={
                    <ProtectedRoute>
                        <Internet />
                    </ProtectedRoute>
                } />

                <Route path="/transfer" element={
                    <ProtectedRoute>
                        <Transfer />
                    </ProtectedRoute>
                } />

                <Route path="/bills" element={
                    <ProtectedRoute>
                        <Bills />
                    </ProtectedRoute>
                } />

                <Route path="/topup" element={
                    <ProtectedRoute>
                        <TopUp />
                    </ProtectedRoute>
                } />

                <Route path="/transactions" element={
                    <ProtectedRoute>
                        <Transactions />
                    </ProtectedRoute>
                } />

                <Route path="/wallet" element={
                    <ProtectedRoute>
                        <Wallet />
                    </ProtectedRoute>
                } />

                <Route path="/p2ptransfer" element={
                    <ProtectedRoute>
                        <P2PTransfer />
                    </ProtectedRoute>
                } />

                <Route path="/withdraw" element={
                    <ProtectedRoute>
                        <Withdraw />
                    </ProtectedRoute>
                } />

                <Route path="/analysis" element={
                    <ProtectedRoute>
                        <Analysis />
                    </ProtectedRoute>
                } />

                <Route path="/statistics" element={
                    <ProtectedRoute>
                        <Statistics />
                    </ProtectedRoute>
                } />

                <Route path="/contacts" element={
                    <ProtectedRoute>
                        <Contacts />
                    </ProtectedRoute>
                } />

                <Route path="/receipts" element={
                    <ProtectedRoute>
                        <Receipts />
                    </ProtectedRoute>
                } />

                <Route path="/profile" element={
                    <ProtectedRoute>
                        <Profile />
                    </ProtectedRoute>
                } />
            </Route>

            <Route path="*" element={<RootRedirect />} />
        </Routes>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}