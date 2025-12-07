import { useAuthStore } from "../../store/authStore";
import Screen from "../../components/Screen";
import Button from "../../components/ui/Button";

export default function Profile() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <Screen>
      {/* ton contenu */}
      <Button title="Se déconnecter" onPress={logout} />
    </Screen>
  );
}