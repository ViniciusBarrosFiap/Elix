import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { usePathname } from "expo-router";
import { useEffect } from "react";
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
 
function ElixTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  
  const pathname = usePathname();

  // Lista de rotas onde o tab bar deve sumir
  const hiddenRoutes = ['/studyContents/addContent','/quiz'];

  if (hiddenRoutes.some(route => pathname.includes(route))) {
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
        {state.routes.map((route, index) => {
          const tab = TABS.find((t) => t.name === route.name);
          if (!tab) return null;
          const focused = state.index === index;
          const { options } = descriptors[route.key];
 
          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };
 
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
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