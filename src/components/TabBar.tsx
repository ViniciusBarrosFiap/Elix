import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { router, usePathname } from "expo-router";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Tab definitions

const TABS = [
  {
    name: "home/index",
    label: "Início",
    icon: (focused: boolean, color: string) => (
      <Ionicons name={focused ? "home" : "home-outline"} size={20} color={color} />
    ),
  },
  // {
  //   name: "conteudos",
  //   label: "Conteúdos",
  //   icon: (focused: boolean) => (
  //     <Feather
  //       name="layers"
  //       size={19}
  //       color={focused ? "#8b5cf6" : "rgba(255,255,255,0.38)"}
  //     />
  //   ),
  // },
  // {
  //   name: "progresso",
  //   label: "Progresso",
  //   icon: (focused: boolean) => (
  //     <Feather
  //       name="bar-chart-2"
  //       size={19}
  //       color={focused ? "#8b5cf6" : "rgba(255,255,255,0.38)"}
  //     />
  //   ),
  // },
  {
    name: "profile/index",
    label: "Perfil",
    icon: (focused: boolean, color: string) => (
      <Ionicons name={focused ? "person" : "person-outline"} size={20} color={color} />
    ),
  },
];

const ACCENT = "#8b5cf6";
const INACTIVE = "rgba(255,255,255,0.45)";

// ─── Custom Tab Bar
//
// Substitui a tab bar nativa de app/(tabs)/_layout.tsx (Tabs navigator real —
// Home e Perfil ficam sempre montados, só esta barra decide o que mostrar).
// Lê a rota atual via usePathname() e navega via router.navigate, que troca
// de aba (jump, sem remontar) em vez de empilhar uma tela nova.
//
// Pill flutuante com blur — o iOS usa material translúcido (UIBlurEffect) por
// padrão na tab bar do sistema, então o blur aqui é consistente com a
// convenção nativa; no Android não é o idiomático (Material prefere superfície
// sólida elevada), mas aplicamos igual pra manter os dois com a mesma
// aparência flutuante.

function ElixTabBar() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  // Lista de rotas (prefixos exatos) onde o tab bar deve sumir
  const hiddenRoutes = ['/studyContents/addContent', '/quiz'];

  // Tela de detalhe da disciplina: /studyContents/<id>, exceto /studyContents/addContent
  const isDisciplinaDetalhe = /^\/studyContents\/(?!addContent(\/|$))[^/]+/.test(pathname);

  if (isDisciplinaDetalhe || hiddenRoutes.some(route => pathname.includes(route))) {
    return null;
  }

  const isIOS = Platform.OS === "ios";

  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 32,
        paddingBottom: insets.bottom * 0.6,
      }}
    >
      <BlurView
        intensity={isIOS ? 70 : 90}
        tint="dark"
        style={{
          flexDirection: "row",
          borderRadius: 50,
          paddingVertical: 10,
          paddingHorizontal: 8,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.12)",
          overflow: "hidden",
        }}
      >
        {TABS.map((tab) => {
          const focused = pathname === `/${tab.name.replace(/\/index$/, "")}`;
          const color = focused ? ACCENT : INACTIVE;

          const onPress = () => {
            if (!focused) {
              // Rotas "index.tsx" resolvem pelo caminho da pasta, sem o
              // sufixo "/index" — só a checagem de "focused" acima precisava
              // dele pra bater com usePathname(), a navegação em si não.
              router.navigate(`/(tabs)/${tab.name.replace(/\/index$/, "")}` as never);
            }
          };

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={tab.label}
              activeOpacity={0.7}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                paddingVertical: 4,
              }}
            >
              {tab.icon(focused, color)}
              <Text style={{ fontSize: 11, fontWeight: "500", color }}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
}

export default ElixTabBar
