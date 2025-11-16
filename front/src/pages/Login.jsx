import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PhoneInput from "react-phone-input-2";
import { useNavigate } from "react-router-dom";
import BrandLogo from "@/components/common/BrandLogo";
import 'react-phone-input-2/lib/style.css';

import { useLogin } from "@/hooks/useLogin";
import { useAuthContext } from "@/components/common/AuthContext";

export default function Login() {
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("")
    const [formError, setFormError] = useState("");
    const { token, loading, error, startLogin } = useLogin();
    const { login } = useAuthContext();
    const navigate = useNavigate();

    useEffect(() => {
        if (token) {
            login(token).then(() => {
                navigate(createPageUrl("Dashboard"));
            });
        }
    }, [token, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);
        await startLogin({ phone, password });
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-100 to-white p-6">
            <Card className="w-full max-w-md shadow-lg border border-violet-100 rounded-2xl">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-3">
                        <BrandLogo size={48} />
                    </div>
                    <CardTitle className="text-2xl font-bold text-violet-700">
                        Connexion
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

                        {(formError || error) && (
                            <p className="text-red-600 text-sm font-medium">{formError || error}</p>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl h-12 font-semibold"
                            disabled={loading}
                        >
                            {loading ? "Chargement" : "Connexion"}
                        </Button>

                        <p className="text-center text-sm text-gray-600">
                            Créé un compte ?
                            <Link
                                to={createPageUrl("Register")}
                                className="text-violet-700 hover:underline font-semibold"
                            >
                                S'inscrire
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}