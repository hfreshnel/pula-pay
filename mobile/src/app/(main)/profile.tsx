import { useAuthStore } from "../../store/authStore";
import Screen from "../../components/screen";
import Button from "../../components/ui/Button";

export default function Profile() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <Screen>
      <Button title="Se déconnecter" onPress={logout} />
    </Screen>
  );
}