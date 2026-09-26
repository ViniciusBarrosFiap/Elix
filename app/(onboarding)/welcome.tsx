import { useRouter } from 'expo-router';
import {
  Image,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import '@/global.css'
import { colors } from '@/src/theme/colors';

export default function WelcomeScreen() {
  const elixPotionPath = require('@/assets/images/elix-potion.png')
  const elixLogoPath = require('@/assets/images/elix-logo.png')
  const router = useRouter()

  function handleAccessBtns(accessType: 'signUp' | 'signIn') {
    router.push(accessType === 'signUp' ? '/(auth)/register' : '/(auth)/login')
  }

  return (
    <View className="flex-1 bg-surface items-center justify-center px-6 overflow-hidden" >
      <StatusBar barStyle="light-content" />

      {/* Main Content */}
      <View className="w-full max-w-md items-center space-y-8">
        {/* Logo */}
        <View className="w-40 mb-2">
          <Image
            source={elixLogoPath}
            resizeMode="contain"
            className="w-full h-20"
          />
        </View>

        {/* Main Image */}
        <View className="relative w-[307px] h-[307px] items-center justify-center">
          {/* Glow */}
          <Image
            source={elixPotionPath}
            resizeMode="contain"
            className="w-full h-full"
          />
        </View>

        {/* Text Content */}
        <View className="px-2 items-center mt-6">
          <Text className="text-onSurface text-[36px] font-extrabold text-center leading-[40px] tracking-[-0.8px]">
            Transforme seus estudos em aprendizado real
          </Text>

          <Text className="text-onSurfaceVariant text-base text-center leading-7 mt-4 max-w-[280px]">
            O Elix ajuda você a dominar o que aprendeu através de revisões
            diárias
          </Text>
        </View>

        {/* Buttons */}
        <View className="w-full mt-10 space-y-4">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleAccessBtns('signUp')}
            className="w-full bg-primaryContainer py-4 rounded-full items-center"
            style={{
              shadowColor: colors.primaryContainer,
              shadowOffset: {
                width: 0,
                height: 10,
              },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            <Text className="text-onPrimaryContainer text-lg font-bold">
              Começar Jornada
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            className="w-full py-3 items-center"
            onPress={() => handleAccessBtns('signIn')}
          >
            <Text className="text-primary text-base font-medium">
              Já tenho uma conta
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}