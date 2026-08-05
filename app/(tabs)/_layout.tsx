import ElixTabBar from "@/src/components/TabBar";
import { Tabs } from "expo-router";

export default function TabsLayout() {

  return (
    <Tabs
      tabBar={(props) => <ElixTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: "Home",
        }}
      />

      <Tabs.Screen
        name="quiz/index"
        options={{
          href: null, // esconde da tab bar
        }}
      />
    </Tabs>
  );
}