import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Wallet, CheckCircle, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import PhoneInput from "react-phone-input-2";
import { createPageUrl } from "@/utils";

import { useDeposit } from "@/hooks/useDeposit";
import { useAuthContext } from "@/components/common/AuthContext";

export default function TopUp() {
	const [method, setMethod] = useState("MTN_MoMo");
	const [phone, setPhone] = useState("");
	const [amount, setAmount] = useState("");
	// local waiting flag removed: rely on `loading` / `status` from useDeposit

	const [submittedTx, setSubmittedTx] = useState(null);
	const { txId, status, loading, error, startDeposit } = useDeposit();
	const { user } = useAuthContext();

	// format amount string like "1234.56" -> "1 234,56 €"
	const formatCurrencyFromString = (amtStr) => {
		if (!amtStr) return "";
		const parts = amtStr.split('.');
		const intPart = parts[0] || '0';
		const decPart = (parts[1] || '00').padEnd(2, '0').slice(0,2);
		const intWithSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
		return `${intWithSep},${decPart} €`;
	};

	useEffect(() => {
		if (user.phone) {
			setPhone(user.phone);
		}
	}, [user])

	useEffect(() => {
		if (status === "SUCCESS" && !submittedTx) {
			setSubmittedTx({
				amount,
				recipient_phone: phone,
				method,
				txId
			});
		}
	}, [status, submittedTx, amount, phone, method, txId]);

	const handleSubmit = async (e) => {
		e.preventDefault();

		// amount validation is handled by the backend; send amount string as-is

		if (!user?.id) {
			alert("Utilisateur non authentifié");
			return;
		}

		try {
			if (method === "MTN_MoMo") {
				// send amount as string with two decimals
				await startDeposit({ userId: user.id, amount: amount, msisdn: phone, currency: "EUR" });
			} else {
				alert("Méthode non encore supportée");
			}
		} catch (err) {
			console.error("Erreur dépôt:", err);
		}
	};

	const canUpdate = () => {
		// allow updates unless a deposit is currently pending
		return status !== "PENDING";
	}

	const canSubmit = () => {
		if (loading || !canUpdate()) return false;
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
									{formatCurrencyFromString(submittedTx.amount)}
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
							Via MoMo ou Moov Money
						</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-5">
							<div className="grid gap-2">
								<Label>Méthode</Label>
								<Select value={method} onValueChange={setMethod} disabled={loading || status === "PENDING"}>
									<SelectTrigger><SelectValue /></SelectTrigger>
									<SelectContent>
										<SelectItem value="MTN_MoMo">MTN MoMo</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="grid gap-2">
								<Label>Numéro associé</Label>
								<PhoneInput
									country={"bj"}
									value={phone}
									disabled={true}
									inputProps={{
										name: "phone",
										required: true,
										readOnly: true,
									}}
									inputClass="!w-full !py-2 !text-base !bg-gray-100 !cursor-not-allowed"
									containerClass="!w-full"
								/>
							</div>

							<div className="grid gap-2">
								<Label>Montant (EUR)</Label>
								<Input
									type="text"
									placeholder="Ex: 100.00"
									value={amount}
									disabled={loading || status === "PENDING"}
									onChange={(e) => setAmount(e.target.value)}
								/>
							</div>

							<Button
								type="submit"
								disabled={!canSubmit()}
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