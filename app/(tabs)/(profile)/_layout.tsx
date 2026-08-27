import { Stack } from "expo-router";

// Stack próprio da aba Perfil — hoje só tem a própria tela, mas fica como
// Stack (não um componente solto) pra poder ganhar telas empilhadas no
// futuro (ex: "Editar disciplinas" vindo do Perfil) sem precisar reestruturar
// de novo.
export default function ProfileStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="profile/index" />
    </Stack>
  );
}
