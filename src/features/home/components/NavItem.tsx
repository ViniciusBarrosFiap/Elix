import { Text, TouchableOpacity } from "react-native";

type NavItemProps = {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
};

const NavItem = ({ icon, label, active = false }: NavItemProps) => (
  <TouchableOpacity className="flex-1 items-center justify-center py-2 gap-1">
    {icon}
    <Text
      className="text-xs font-medium"
      style={{ color: active ? "#8b5cf6" : "rgba(255,255,255,0.4)" }}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

export default NavItem