import { AntDesign } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { router, useNavigation } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";
import Header from "./components/Header";
import DoseCard from "./components/DoseCard";
import YourContents from "./components/YourContents";
import ContentCards from "./components/ContentCards";
import UploadButton from "./components/UploadButton";
import { StudyContentService } from "@/src/services/studyContent/studyContent.service";
import { useStudyContentStore } from "@/src/store/studyContentStore";
import { useUserDataStore } from "@/src/store/userDataStore";
import { UserService } from "@/src/services/user/user.service";
import { useAppInit } from "@/src/hooks/useAppInit";
import LoadingScreen from "../loadingScreen/LoadingScreen";
import { BlurView } from "expo-blur";

export default function HomeScreen() {
  // Animação de fade-in e slide-up para os conteúdos da tela
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  
  // 1. Ref para controlar o Bottom Sheet
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  // 2. Define as alturas que o Bottom Sheet pode assumir (ex: 25% e 50% da tela)
  const snapPoints = useMemo(() => ["20%"], []);
  // 3. Função disparada pelo seu Upload Button
  const handlePresentModalPress = () => {
    bottomSheetModalRef.current?.present();
  };
  
  // Função para renderizar o backdrop do Bottom Sheet, garantindo que ele desapareça quando o modal fechar
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1} // Fica invisível quando o modal fecha
      appearsOnIndex={0} // Aparece assim que o modal abre no primeiro snap point
      pressBehavior="close" // Garante que o toque fechará o modal
      />
    ),
    [],
  );

    const renderBackground = useCallback(
  (props: any) => (
    <BlurView
      // O props.style é injetado pela biblioteca para posicionar o fundo
      style={[props.style, { borderRadius: 24, overflow: 'hidden' }]}
      tint="default"
      intensity={50} // Ajuste a força do vidro
    />
  ),
  []
);

  
  // Inicia as animações de fade-in e slide-up quando a tela é montada
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const studyContentData = useStudyContentStore((state) => state.data);
  const userData = useUserDataStore((state) => state.data);

  return userData?.fezUpload ? (
    <View className="flex-1 bg-[#080510]">
        <Animated.View
          style={{
            flex: 1,
            opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <Header />
        <DoseCard
          onPress={() => {
            router.push("/(tabs)/quiz")
          }}
        />
        <YourContents />
        <ContentCards macroTemas={studyContentData?.macrotemas} />
      </Animated.View>
      <UploadButton onPress={handlePresentModalPress} />
      {/* O BOTTOM SHEET EM SI */}
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0} // abre no primeiro ponto
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: "black" }}
      >
        <BottomSheetView style={{ flex: 1, alignItems: "center", padding: 24 }}>
          <TouchableOpacity
            onPress={() => {
              bottomSheetModalRef.current?.dismiss();
              router.push("/(tabs)/studyContents/addContent");
            }}
            className="flex-row items-center p-4 my-2 mx-4 rounded-xl shadow-sm elevation-1"
          >
            {/* Ícone posicionado à esquerda com fundo leve */}
            <View className="mr-4 p-2.5 rounded-full">
              <AntDesign name="plus" size={24} color="#d3a0fc" />
            </View>
            {/* Bloco de texto empilhado (Título em cima, Subtítulo em baixo) */}
            <View className="flex-1">
              <Text className="text-lg font-semibold text-white mb-1">
                Adicionar Conteúdo
              </Text>
              <Text className="text-sm text-gray-500">
                Inclua Documentos, anotações de aula, o que estudou
              </Text>
            </View>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  )
  :
  (
    <View className="flex-1 bg-[#080510]">
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <Header />
        <View className="flex-1 justify-center items-center px-8">
          <Text className="text-lg font-semibold text-center text-[#d3a0fc]" style={{ marginTop: "-50%" }}>
            Faça o upload dos seus materiais de estudo e comece a sua jornada de revisão personalizada!
          </Text>
          <View className="h-[100]"/>
        </View>
      </Animated.View>
      <UploadButton onPress={handlePresentModalPress} />
      {/* O BOTTOM SHEET EM SI */}
<BottomSheetModal
        ref={bottomSheetModalRef}
        index={0} // abre no primeiro ponto
        snapPoints={snapPoints}
         backgroundComponent={renderBackground}
        backdropComponent={renderBackdrop}
        
      >
        <BottomSheetView style={{flex:1,alignItems:'center',padding:24}}>
            
              <TouchableOpacity onPress={()=>{ bottomSheetModalRef.current?.dismiss();router.push("/studyContents/addContent")}} className="flex-row items-center p-4 my-2 mx-4 rounded-xl shadow-sm elevation-1">
                
                {/* Ícone posicionado à esquerda com fundo leve */}
                <View className="mr-4 p-2.5 rounded-full">
                  <AntDesign name="plus" size={24} color="#d3a0fc" />
                </View>

                {/* Bloco de texto empilhado (Título em cima, Subtítulo em baixo) */}
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-white mb-1">
                    Adicionar Conteúdo
                  </Text>
                  <Text className="text-sm text-gray-500">
                    Inclua Documentos, anotações de aula, o que estudou
                  </Text>
                </View>

              </TouchableOpacity>
      
        </BottomSheetView>
      </BottomSheetModal>

    </View>
  )
}
