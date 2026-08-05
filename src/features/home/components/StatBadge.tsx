import { Text, TouchableOpacity, View } from "react-native";

const StatBadge = ({
  icon,
  value,
  OnPress
}: {
  icon: React.ReactNode;
  value: string;
  OnPress?: () => void;
}) => (
  <TouchableOpacity
    className="flex-row items-center min-h-10 px-3 py-1.5 ml-3 rounded-lg border border-white/10"
    style={{ backgroundColor: "rgba(255,255,255,0.07)" }}
    onPress={OnPress}
  >
    {icon}
    <Text className="text-white text-sm font-semibold ml-1.5">{value}</Text>
  </TouchableOpacity>
);

export default StatBadge