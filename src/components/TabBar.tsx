import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
 
// ─── Tab definitions 
 
const TABS = [
  {
    name: "home/index",
    label: "Início",
    icon: (focused: boolean) => (
      <Ionicons
        name="home"
        size={20}
        color={focused ? "#8b5cf6" : "rgba(255,255,255,0.38)"}
      />
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
  // {
  //   name: "perfil",
  //   label: "Perfil",
  //   icon: (focused: boolean) => (
  //     <Feather
  //       name="user"
  //       size={19}
  //       color={focused ? "#8b5cf6" : "rgba(255,255,255,0.38)"}
  //     />
  //   ),
  // },
];
 
// ─── Custom Tab Bar
//
// Overlay flutuante independente de qualquer navigator de tabs — a navegação
// do app inteiro roda numa Stack (ver app/(tabs)/_layout.tsx), então esta
// barra só lê a rota atual (usePathname) e navega via router.navigate, que
// reaproveita a tela já empilhada em vez de duplicar (mesmo efeito de "trocar
// de tab" que a Tabs navigator dava, mas preservando a transição em pilha).

function ElixTabBar() {
  const pathname = usePathname();

  // Lista de rotas (prefixos exatos) onde o tab bar deve sumir
  const hiddenRoutes = ['/studyContents/addContent', '/quiz'];

  // Tela de detalhe da disciplina: /studyContents/<id>, exceto /studyContents/addContent
  const isDisciplinaDetalhe = /^\/studyContents\/(?!addContent(\/|$))[^/]+/.test(pathname);

  if (isDisciplinaDetalhe || hiddenRoutes.some(route => pathname.includes(route))) {
    return null;
  }

  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingBottom: 28,

      }}
    >
      {/* Pill container */}
      <View
        style={{
          backgroundColor: "#1c1130",
          borderRadius: 28,
          flexDirection: "row",
          paddingVertical: 10,
          paddingHorizontal: 8,
          borderWidth: 1,
          borderColor: "#453764"
        }}
      >
        {TABS.map((tab) => {
          const focused = pathname === `/${tab.name.replace(/\/index$/, "")}`;

          const onPress = () => {
            if (!focused) {
              router.navigate(`/(tabs)/${tab.name}` as never);
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
              {tab.icon(focused)}
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "500",
                  color: focused ? "#8b5cf6" : "rgba(255,255,255,0.38)",
                }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default ElixTabBar