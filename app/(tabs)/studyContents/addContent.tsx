import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  ChevronRight,
  FileText,
  Paperclip,
  Plus,
  Tag,
  UploadCloud,
  Wand2,
  X,
} from 'lucide-react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { UserService } from '@/src/services/user/user.service';

type TagItem = {
  id: string;
  label: string;
};

type AttachedFile = {
  id: string;
  name: string;
  size: string;
  pages: string;
  kind: 'pdf' | 'docx';
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Design Tokens 
const C = {
  surface:                '#16111b',
  surfaceContainerLowest: '#110c16',
  surfaceContainerLow:    '#1f1924',
  surfaceContainer:       '#231d28',
  surfaceContainerHigh:   '#2e2832',
  surfaceContainerHighest:'#39323d',
  primaryContainer:       '#8a2be2',
  onPrimaryContainer:     '#eed9ff',
  primary:                '#dcb8ff',
  onSurface:              '#eadfee',
  onSurfaceVariant:       '#cfc2d7',
  outlineVariant:         '#4c4354',
  secondaryContainer:     '#5d3587',
  onSecondaryContainer:   '#d2a6ff',
};

export default function AddContent() {
  const [description, setDescription] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const pressAnim = useRef(new Animated.Value(1)).current;
  const [files, setFiles] = useState<any[]>([]);

  const [tags, setTags] = useState<TagItem[]>([]);
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const [newTagText, setNewTagText] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  const handleRemoveTag = (id: string) => {
    setTags((prev) => prev.filter((t) => t.id !== id));
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleAddTag = () => {
    const trimmedText = newTagText.trim();
    if (!trimmedText) {
      setIsAddingTag(false);
      return;
    }
    if (tags.some((t) => t.label.toLowerCase() === trimmedText.toLowerCase())) {
      Alert.alert('Tag já existente', 'Esta tag já foi adicionada.');
      return;
    }
    const newTag: TagItem = {
      id: Date.now().toString(),
      label: trimmedText,
    };
    setTags((prev) => [...prev, newTag]);
    setNewTagText('');
    setIsAddingTag(false);
  };

  const selecionarDocumento = async () => {
    try {
      const resultado = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], // Filtra para PDF e DOCX
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!resultado.canceled) {
        const arquivoSelecionado = resultado.assets[0];

        // 1. Descobrir a extensão (kind)
        const isDocx = arquivoSelecionado.name.toLowerCase().endsWith('.docx');
        const tipoExtensão: 'pdf' | 'docx' = isDocx ? 'docx' : 'pdf';

        // 2. Formatar o tamanho de Bytes para MB
        const tamanhoEmMB = arquivoSelecionado.size 
          ? `${(arquivoSelecionado.size / (1024 * 1024)).toFixed(1)} MB` 
          : '0 MB';

        // 3. Montar o objeto no formato da sua tipagem `AttachedFile`
        const novoArquivo: AttachedFile = {
          id: Date.now().toString(), // Gera um ID único simples
          name: arquivoSelecionado.name,
          size: tamanhoEmMB,
          pages: '-- páginas', // O picker não lê páginas nativamente, deixamos um padrão
          kind: tipoExtensão,
        };

        // 4. Atualizar os estados corretamente
        setFile(arquivoSelecionado); // Se ainda precisar do asset bruto
        setFiles((prev) => [...prev, novoArquivo]); // Adiciona o novo arquivo à lista existente
        
      } else {
        Alert.alert('Cancelado', 'Nenhum arquivo foi selecionado.');
      }
    } catch (error) {
      console.error('Erro ao selecionar arquivo:', error);
      Alert.alert('Erro', 'Não foi possível abrir o seletor de arquivos.');
    }
  };

  const maxChars = 1000;
  
  const [activeTab, setActiveTab] = useState<'descricao' | 'arquivos'>('descricao');

  function handleUploadPress() {
    Animated.sequence([
      Animated.timing(pressAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(pressAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();

    handlePickFile();
  }

  async function handleGenerate() {
    // await uploadFiles(files);
    await UserService.updateUser({
      fezUpload: true,
    });
    router.replace({
      pathname: "/loadingScreen",
      params: {
        next: "/home",
        title: "Gerando revisão...",
      }
    })
  }

  async function handlePickFile() {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*', // ou 'application/pdf'
      multiple: true,
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    const files = result.assets;
    console.log(files);

    setFiles(files); // você cria esse state
  }

  return (
    // Versão Nova:
    <SafeAreaView className="flex-1 bg-[#0b0914]" edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />

      {/* Ambient violet glow */}
      <View pointerEvents="none" className="absolute inset-0 opacity-30">
        <LinearGradient
          colors={['transparent', '#8a2be2', 'transparent']}
          start={{ x: 0.5, y: 0.4 }}
          end={{ x: 0.5, y: 0.9 }}
          style={{ flex: 1 }}
        />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 pt-6">
          <Pressable
            onPress={() => router.back()}
            className="w-12 h-12 -ml-1 items-center justify-center active:opacity-70"
            hitSlop={8}
          >
            <ArrowLeft size={28} color="#f8f8f8" />
          </Pressable>

          <View className="mt-10 mb-4 px-1">
            {/* Título Maior (Aumentado para text-5xl e tracking mais espaçado) */}
            <Text className="font-bold text-[#f8f8f8] text-4xl tracking-tight text-center">
              Adicionar conteúdo
            </Text>
            {/* Subtítulo Maior (Aumentado para text-base) */}
            <Text className="text-[#a09ba8] text-base text-center mt-4 leading-6 px-2">
              Reforce o que estudou e adicione materiais para gerar sua
              revisão.
            </Text>
          </View>
        </View>


        <View className="flex-1 mt-4 mx-4 border border-white/10 rounded-3xl bg-transparent p-2">


  

        {/* Foco da revisão */}
        {/* Aumento de margem de mt-8 para mt-12 e padding interno de p-5 para p-6 */}
        <View className=" mt-5">
          <View className="rounded-3xl  p-4">
            {/* Section header */}
            <View className="flex-row items-center mb-6">
              {/* Ícone maior */}
              <View className="w-12 h-12 rounded-xl bg-[#1a1528] items-center justify-center border border-[#8a2be2]/20 mr-4">
                <Tag size={22} color="#8A2BE2" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center mb-1.5">
                  {/* Texto de cabeçalho da seção aumentado para text-lg */}
                  <Text className="text-lg font-semibold text-[#f8f8f8] mr-3">
                    Foco da revisão
                  </Text>
                  <View className="px-2.5 py-1 rounded-full bg-[#8a2be2]/10 border border-[#8a2be2]/20">
                    <Text className="text-[11px] uppercase font-bold tracking-wider text-[#8A2BE2]">
                      Opcional
                    </Text>
                  </View>
                </View>
                {/* Texto de apoio aumentado para text-sm */}
                <Text className="text-sm text-[#a09ba8]">
                  Adicione tags com os temas que você quer revisar mais.
                </Text>
              </View>
            </View>

            {/* Tags container */}
            <View className="border border-[#8a2be2]/40 rounded-2xl p-5 bg-[#110e1b]/50">
              <View className="flex-row flex-wrap mb-2">
                {tags.map((tag) => (
                  <View key={tag.id} className="mr-2.5 mb-2.5">
                    {/* Tags visivelmente maiores: texto text-base e mais padding vertical/horizontal */}
                    <View className="flex-row items-center rounded-full bg-[#8a2be2]/15 border border-[#8a2be2]/30 pl-5 pr-3 py-2">
                      <Text className="text-base font-medium text-white/90 mr-3">
                        {tag.label}
                      </Text>
                      <Pressable
                        onPress={() => handleRemoveTag(tag.id)}
                        className="w-6 h-6 rounded-full items-center justify-center active:bg-white/10"
                        hitSlop={6}
                      >
                        <X size={16} color="rgba(255,255,255,0.7)" />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>

              {/* Botão / Input de adicionar tag maiores */}
              {isAddingTag ? (
                <View className="flex-row items-center mt-3 border border-[#8a2be2]/60 rounded-xl bg-[#1a1528] px-4 py-3">
                  <TextInput
                    className="flex-1 text-base font-medium text-white p-0 mr-3"
                    placeholder="Digite a tag..."
                    placeholderTextColor="#635e72"
                    value={newTagText}
                    onChangeText={setNewTagText}
                    autoFocus
                    onSubmitEditing={handleAddTag}
                    returnKeyType="done"
                    maxLength={25}
                  />
                  <Pressable 
                    onPress={handleAddTag} 
                    className="w-8 h-8 bg-[#8a2be2]/20 rounded-lg items-center justify-center mr-3 active:bg-[#8a2be2]/40"
                    hitSlop={6}
                  >
                    <Plus size={18} color="#8A2BE2" />
                  </Pressable>
                  <Pressable onPress={() => { setIsAddingTag(false); setNewTagText(''); }} hitSlop={6}>
                    <X size={18} color="#a09ba8" />
                  </Pressable>
                </View>
              ) : (
                <Pressable 
                  onPress={() => setIsAddingTag(true)} 
                  className="flex-row items-center mt-3 active:opacity-70"
                >
                  <View className="w-9 h-9 rounded-lg border border-dashed border-[#a09ba8]/40 items-center justify-center mr-3">
                    <Plus size={20} color="#a09ba8" />
                  </View>
                  <Text className="text-base font-medium text-[#a09ba8]">
                    Adicionar tag
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {/* Materiais */}
        {/* Aumento de margem de mt-8 para mt-12 */}
        <View className="px-6 mt-12">
          {/* Section header */}
          <View className="flex-row items-center mb-6">
            <View className="w-12 h-12 rounded-xl bg-[#1a1528] items-center justify-center border border-[#8a2be2]/20 mr-4">
              <Paperclip size={22} color="#8A2BE2" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-[#f8f8f8] mb-1">
                Materiais
              </Text>
              <Text className="text-sm text-[#a09ba8]">
                Adicione arquivos ou importe de outras ferramentas.
              </Text>
            </View>
          </View>

          {/* Action buttons */}
          <View className="mb-8">
            {/* Select file (Botões maiores com p-5 e textos maiores) */}
            <Pressable onPress={selecionarDocumento} className="w-full bg-[#1a1528] active:bg-[#201a30] border border-white/5 rounded-2xl p-5 flex-row items-center justify-between mb-4">
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 rounded-xl bg-[#110e1b] items-center justify-center border border-white/5 mr-4">
                  <UploadCloud size={24} color="#8A2BE2" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-white mb-1">
                    Selecionar arquivo
                  </Text>
                  <Text className="text-xs text-[#a09ba8]">
                    PDF, DOCX, TXT ou imagens
                  </Text>
                </View>
              </View>
              <ChevronRight size={22} color="#8A2BE2" />
            </Pressable>

            {/* Import Notion */}
            <Pressable className="w-full bg-[#1a1528] active:bg-[#201a30] border border-white/5 rounded-2xl p-5 flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 rounded-xl bg-black items-center justify-center border border-white/10 mr-4">
                  <Image
                    source={require('@/assets/images/icon-notion.png')}
                    resizeMode="contain"
                    className="w-10 h-10"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-white mb-1">
                    Importar do Notion
                  </Text>
                  <Text className="text-xs text-[#a09ba8]">
                    Selecione páginas ou bancos
                  </Text>
                </View>
              </View>
              <ChevronRight size={22} color="#8A2BE2" />
            </Pressable>
          </View>

          {/* Added files list */}
          <View>
            <Text className="text-sm font-medium text-[#a09ba8] mb-4">
              Arquivos adicionados ({files.length})
            </Text>

            <View>
              {files.map((file) => (
                <View
                  key={file.id}
                  className="bg-[#1a1528]/50 border border-white/5 rounded-2xl p-4 flex-row items-center justify-between mb-4"
                >
                  <View className="flex-row items-center flex-1 mr-2">
                    <View
                      className={`w-12 h-14 rounded-lg items-center justify-center mr-4 ${
                        file.kind === 'pdf' ? 'bg-[#e53935]' : 'bg-[#1e88e5]'
                      }`}
                    >
                      {file.kind === 'pdf' ? (
                        <Text className="text-white text-[11px] font-bold tracking-wider">
                          PDF
                        </Text>
                      ) : (
                        <FileText size={24} color="#ffffff" />
                      )}
                    </View>
                    <View className="flex-1">
                      <Text
                        className="text-base font-medium text-white mb-1.5"
                        numberOfLines={1}
                      >
                        {file.name}
                      </Text>
                      <View className="flex-row items-center">
                        <Text className="text-xs text-[#a09ba8]">
                          {file.size}
                        </Text>
                        <View className="w-1.5 h-1.5 rounded-full bg-[#a09ba8]/50 mx-2" />
                        <Text className="text-xs text-[#a09ba8]">
                          {file.pages}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => handleRemoveFile(file.id)}
                    className="w-10 h-10 rounded-full items-center justify-center active:bg-white/10"
                    hitSlop={6}
                  >
                    <X size={20} color="#a09ba8" />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        </View>

           </View>
      </ScrollView>

   

      {/* Bottom action */}
      <LinearGradient
        colors={['transparent', '#0b0914', '#0b0914']}
        locations={[0, 0.35, 1]}
        className="absolute bottom-0 left-0 right-0 px-6 pt-12 pb-8"
      >
        <TouchableOpacity 
          onPress={handleGenerate} 
          className="active:opacity-90"
        >
          <LinearGradient
            colors={['#7b2cbf', '#5a189a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 18 }}
          >
            {/* Botão de ação principal maior com py-5 e texto text-lg */}
            <View className="flex-row items-center justify-center py-5 ">
              <Wand2 size={22} color="#ffffff" />
              <Text className="font-semibold text-white text-lg ml-2.5">
                Gerar revisão
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>

    // Versão Antiga:
    // <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
     
    //     {/* ── Header ── */}
    //     <View style={styles.header}>
    //       <TouchableOpacity
    //         onPress={() => router.back()}
    //         style={styles.backButton}
    //         activeOpacity={0.7}
    //       >
    //         <Ionicons name="arrow-back" size={20} color={C.onSurface} />
    //       </TouchableOpacity>
    //       <Text style={styles.headerTitle}>Adicionar conteúdo</Text>
    //       <View style={{ width: 40 }} />
    //     </View>

    //     {/* Tab Selector */}
    //     <View style={styles.tabContainer}>
    //       <TouchableOpacity
    //         style={[styles.tab, activeTab === 'descricao' && styles.tabActive]}
    //         onPress={() => setActiveTab('descricao')}
    //         activeOpacity={0.7}
    //       >
    //         <Text style={[styles.tabText, activeTab === 'descricao' && styles.tabTextActive]}>
    //           Descrição
    //         </Text>
    //       </TouchableOpacity>
    //       <TouchableOpacity
    //         style={[styles.tab, activeTab === 'arquivos' && styles.tabActive]}
    //         onPress={() => setActiveTab('arquivos')}
    //         activeOpacity={0.7}
    //       >
    //         <Text style={[styles.tabText, activeTab === 'arquivos' && styles.tabTextActive]}>
    //           Arquivos
    //         </Text>
    //       </TouchableOpacity>
    //     </View>

    //     <KeyboardAwareScrollView
    //       style={{ flex: 1 }}
    //       contentContainerStyle={styles.scrollContent}
    //       showsVerticalScrollIndicator={false}
    //       keyboardShouldPersistTaps="handled"
    //       enableOnAndroid={true}
    //       extraScrollHeight={20}
    //     >
    //       {activeTab === 'descricao' && (
    //         <View style={styles.section}>
    //           <View style={styles.sectionHeader}>
    //             <View style={styles.iconBox}>
    //               <Feather name="edit-2" size={22} color={C.primaryContainer} />
    //             </View>
    //             <View style={{ flex: 1 }}>
    //               <Text style={styles.sectionTitle}>Descrição do estudo</Text>
    //               <Text style={styles.sectionSubtitle}>
    //                 Conte o que você quer focar e deixe a{' '}
    //                 <Text style={{ color: C.primaryContainer, fontFamily: 'Manrope_600SemiBold' }}>
    //                   Elix
    //                 </Text>{' '}
    //                 criar sua revisão ideal
    //               </Text>
    //             </View>
    //           </View>

    //           {/* Textarea */}
    //           <View
    //             style={[
    //               isFocused && {
    //                 // shadowColor: "C.primaryContainer", // Este shadowColor é a causa do bug de deseleção do TextInput
    //                 // shadowOpacity: 0.15,
    //                 // shadowRadius: 8,
    //               }
    //             ]}
    //           >
    //             <View
    //               className='rounded-2xl border p-4 min-h-8'
    //               style={[
    //                 { borderColor: '#4c4354' },
    //                 isFocused && { borderColor: C.primaryContainer }
    //               ]}
    //             >
    //               <TextInput
    //                 className="text-base text-[#eadfee] min-h-[100px]"
    //                 placeholder="Ex: revisar hipotálamo, neuro-hipófise e glândula tireoide"
    //                 placeholderTextColor={C.onSurfaceVariant + '80'}
    //                 multiline
    //                 maxLength={maxChars}
    //                 value={description}
    //                 onChangeText={setDescription}
    //                 onFocus={() => setIsFocused(true)}
    //                 onBlur={() => setIsFocused(false)}
    //                 textAlignVertical="top"
    //               />
    //                 <Text style={styles.charCount}>
    //                   {description.length}/{maxChars}
    //                 </Text>
    //             </View>
    //           </View>
    //         </View>
    //       )}

    //       {activeTab === 'arquivos' && (
    //         <View style={styles.section}>
    //           <View style={styles.sectionHeader}>
    //             <View style={styles.iconBox}>
    //               <Feather name="file-text" size={22} color={C.primaryContainer} />
    //             </View>
    //             <View style={{ flex: 1 }}>
    //               <Text style={styles.sectionTitle}>Materiais</Text>
    //               <Text style={styles.sectionSubtitle}>PDFs, slides ou anotações</Text>
    //             </View>
    //           </View>

    //           {/* Upload area com borda tracejada */}
    //           <Animated.View style={{ transform: [{ scale: pressAnim }] }}>
    //             <TouchableOpacity
    //               onPress={handleUploadPress}
    //               activeOpacity={0.8}
    //               style={styles.uploadArea}
    //             >
    //               {/* Borda tracejada simulada com View aninhadas */}
    //               <View style={styles.uploadInner}>
    //                 <View style={styles.uploadIconWrapper}>
    //                   <Feather name="file-text" size={32} color={C.primaryContainer} />
    //                 </View>
    //                 <Text style={styles.uploadTitle}>Selecionar arquivos</Text>
    //                 <Text style={styles.uploadSubtitle}>
    //                   Escolha arquivos do seu dispositivo
    //                 </Text>
    //               </View>
    //             </TouchableOpacity>
    //           </Animated.View>
    //         </View>
    //       )}

    //       {/* Espaço para o botão fixo não cobrir conteúdo */}
    //     </KeyboardAwareScrollView>

    //     {/* ── Botão Gerar fixo ── */}
    //     <View style={styles.footer}>
    //       <TouchableOpacity
    //         style={styles.generateButton}
    //         activeOpacity={0.85}
    //         onPress={handleGenerate}
    //       >
    //         <Text style={styles.generateButtonText}>Gerar</Text>
    //         <Ionicons name="sparkles" size={20} color={C.onPrimaryContainer} />
    //       </TouchableOpacity>
    //     </View>
    // </SafeAreaView>
  );
}

// ─── Styles 
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.surface,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  tabContainer: {
  flexDirection: 'row',
  backgroundColor: C.surfaceContainerHigh,
  marginHorizontal: 20,
  marginBottom: 20,
  borderRadius: 12,
  padding: 4,
},
tab: {
  flex: 1,
  paddingVertical: 10,
  alignItems: 'center',
  borderRadius: 10,
},
tabActive: {
  backgroundColor: C.surfaceContainerHighest,
},
tabText: {
  fontFamily: 'Manrope_500Medium',
  fontSize: 14,
  color: C.onSurfaceVariant,
},
tabTextActive: {
  fontFamily: 'Manrope_600SemiBold',
  color: C.onSurface,
},
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.surfaceContainer,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 17,
    color: C.onSurface,
  },

  // ── Scroll ──
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // ── Seções ──
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: C.surfaceContainer,
    borderWidth: 1,
    borderColor: C.primaryContainer + '80',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 17,
    color: C.onSurface,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    color: C.onSurfaceVariant,
    lineHeight: 18,
  },

  // ── TextArea ──
  textAreaWrapper: {
    backgroundColor: C.surfaceContainer + '80',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    padding: 16,
    minHeight: 30,
  },
  textAreaWrapperFocused: {
    borderColor: C.primaryContainer,
  },
  textArea: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 15,
    color: C.onSurface,
    minHeight: 30,
    lineHeight: 24,
  },
  charCount: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    color: C.onSurfaceVariant + '99',
    textAlign: 'right',
    marginTop: 8,
  },

  // ── Upload ──
  uploadArea: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  uploadInner: {
    minHeight: 140,
    backgroundColor: C.surfaceContainer + '50',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: C.primaryContainer,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 24,
  },
  uploadIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: C.primaryContainer + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTitle: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 15,
    color: C.onSurface,
  },
  uploadSubtitle: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    color: C.onSurfaceVariant,
  },

  // ── Footer ──
  footer: {
  paddingHorizontal: 20,
  paddingBottom: Platform.OS === 'ios' ? 16 : 24,
  paddingTop: 12,
  backgroundColor: C.surface,
},
  generateButton: {
    height: 60,
    backgroundColor: C.primaryContainer,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: C.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  generateButtonText: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 17,
    color: C.onPrimaryContainer,
  },
});