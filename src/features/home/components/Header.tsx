import { Feather, FontAwesome6, MaterialCommunityIcons } from "@expo/vector-icons"
import { Image, View } from "react-native"
import StatBadge from "./StatBadge"
import { useUserDataStore } from "@/src/store/userDataStore";
import { router } from "expo-router"

const Header = ()=>{
    const userData = useUserDataStore((state) => state.data);
    const openNotionConnect = () => {
        router.push("/connectNotion")
    }

    return (
        <View className="flex-row items-center justify-between w-full px-6 pt-12 pb-6">
            {/* Logo */}
            <View className="flex-row items-center">
                <Image 
                    source={require('@/assets/images/elix-logo.png')} 
                    resizeMode="contain"
                    className="w-28 h-14"
                />
            </View>

            {/* Badges */}
            <View className="flex-row items-center">
                <StatBadge
                    icon={
                    <FontAwesome6 name="droplet" size={12} color="#a78bfa" />
                    }
                    value={String(userData?.pontuacao)}
                />
                <StatBadge
                    icon={
                    <MaterialCommunityIcons
                        name="fire"
                        size={18}
                        color="#f97316"
                    />
                    }
                    value={String(userData?.streak)}
                />
                <StatBadge
                    OnPress={openNotionConnect}
                    icon={
                        <Image 
                            source={require('@/assets/images/icon-notion.png')} 
                            className="w-7 h-7"
                        />
                    }
                    value=""
                />
                <View className="absolute top-0 right-0  w-4 h-4 rounded-full items-center justify-center" style={{ backgroundColor: "#22c55e" }}>
                    <Feather name="check" size={8} color="white" />
                </View>
            </View>
        </View>
    )
}

export default Header