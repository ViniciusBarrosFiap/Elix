import { Feather } from "@expo/vector-icons"
import { Text, TouchableOpacity, View } from "react-native"

const YourContents = ({ onPress }: { onPress?: () => void }) => {
    return (
        <View className="px-6 pt-7 pb-3 flex-row items-center justify-between">
            <Text className="text-white text-lg font-bold">
            Seus conteúdos
            </Text>
            <TouchableOpacity className="flex-row items-center gap-1" onPress={onPress}>
            <Text style={{ color: "#7c3aed" }} className="text-sm font-medium">
                Ver todos
            </Text>
            <Feather name="chevron-right" size={14} color="#7c3aed" />
            </TouchableOpacity>

        </View>
    )
}

export default YourContents