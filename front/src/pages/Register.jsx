import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PhoneInput from "react-phone-input-2";
import { useNavigate } from "react-router-dom";
import BrandLogo from "@/components/common/BrandLogo";
import 'react-phone-input-2/lib/style.css';

import { useRegister } from "@/hooks/useRegister";
import { useVerify } from "@/hooks/useVerify";

export default function Register() {
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [formError, setFormError] = useState(null);
    const [otp, setOtp] = useState("");
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpError, setOtpError] = useState(null);
    const { userId, loading: registering, error, startRegister } = useRegister();
    const { phoneVerified, loading: verifying, error: verifError, startVerify } = useVerify();
    const navigate = useNavigate();

    useEffect(() => {
        if (userId) {
            setShowOtpModal(true);
        }
        else {
            setShowOtpModal(false);
        }
    }, [userId]);

    useEffect(() => {
        if (phoneVerified) {
            setShowOtpModal(false);
            alert("Numéro vérifié avec succès !");
            navigate(createPageUrl("Login"));
        }
    }, [phoneVerified, navigate]);

    useEffect(() => {
        if (verifError) {
            setOtpError(verifError);
        }
    }, [verifError]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);

        if (password !== confirmPassword) {
            setFormError("Les mots de passe ne correspondent pas.");
            return;
        }
        await startRegister({ phone, password });
    }

    const handleVerifyOtp = async () => {
        setOtpError(null);

        if (!otp || otp.length !== 6) {
            setOtpError("Veuillez entrer un code à 6 chffres.");
            return;
        }

        await startVerify({ phone, otp });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-100 to-white p-6">
            <Card className="w-full max-w-md shadow-lg border border-violet-100 rounded-2xl">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-3">
                        <BrandLogo size={48} />
                    </div>
                    <CardTitle className="text-2xl font-bold text-violet-700">
                        Créer un compte
                    </CardTitle>
                </CardHeader>

                <CardContent>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Numéro de téléphone
                            </label>
                            <PhoneInput
                                country={"bj"}
                                value={phone}
                                onChange={(value) => setPhone(value)}
                                inputProps={{
                                    name: "phone",
                                    required: true,
                                }}
                                inputClass="!w-full !py-2 !text-base"
                                containerClass="!w-full"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mot de passe
                            </label>
                            <Input
                                type="password"
                                placeholder="********"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Confirmer le mot de passe
                            </label>
                            <Input
                                type="password"
                                placeholder="********"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full"
                                required
                            />
                        </div>

                        {(formError || error) && (
                            <p className="text-red-600 text-sm font-medium">{formError || error}</p>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl h-12 font-semibold"
                            disabled={registering}
                        >
                            {registering ? "Envoi du code..." : "S'inscrire"}
                        </Button>

                        <p className="text-center text-sm text-gray-600">
                            Déjà un compte ?{" "}
                            <Link
                                to={createPageUrl("Login")}
                                className="text-violet-700 hover:underline font-semibold"
                            >
                                Se connecter
                            </Link>
                        </p>
                    </form>

                </CardContent>

                <Dialog open={showOtpModal} onOpenChange={setShowOtpModal}>
                    <DialogContent className="max-w-sm rounded-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-center text-lg font-semibold text-violet-700">
                                Vérification du numéro
                            </DialogTitle>
                        </DialogHeader>

                        <p className="text-center text-gray-600 mb-3">
                            Entrez le code de vérification reçu par SMS
                        </p>

                        <div className="flex justify-center mb-4">
                            <Input
                                type="text"
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="text-center text-lg tracking-widest w-40"
                            />
                        </div>

                        {(otpError || verifError) && (
                            <p className="text-center text-red-600 text-sm mb-3">
                                {otpError || verifError}
                            </p>
                        )}

                        <div className="flex justify-center">
                            <Button
                                onClick={handleVerifyOtp}
                                className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-6"
                                disabled={verifying}
                            >
                                {verifying ? "Vérification..." : "Vérifier"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </Card>
        </div>
    );
}