import { X } from 'lucide-react-native';
import { ReactNode } from 'react';
import { ActivityIndicator, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Markdown from 'react-native-markdown-display';
import { colors, semantic } from '@/src/theme/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
  titulo: string;
  carregando: boolean;
  erro: string | null;
  markdown: string | null;
  /** Ex: botão "Usar esta página" no fluxo de pré-visualização antes do upload. */
  footer?: ReactNode;
}

/**
 * Modal genérico pra ler conteúdo em markdown — usado pra pré-visualizar uma
 * página do Notion antes de confirmar o upload (addContent.tsx) e pra reler
 * o conteúdo de um material do Notion já importado (studyContents/[id]/index.tsx).
 */
export function MarkdownContentModal({ visible, onClose, titulo, carregando, erro, markdown, footer }: Props) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top', 'bottom']}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 14,
          }}
        >
          <Text
            style={{ flex: 1, color: colors.onSurface, fontFamily: 'Manrope_700Bold', fontSize: 16, marginRight: 12 }}
            numberOfLines={1}
          >
            {titulo}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={8}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.surfaceContainerHigh,
            }}
          >
            <X size={16} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {carregando ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : erro ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
            <Text style={{ color: semantic.danger, textAlign: 'center', fontFamily: 'Manrope_500Medium' }}>
              {erro}
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            <Markdown style={markdownStyles}>{markdown ?? ''}</Markdown>
          </ScrollView>
        )}

        {footer}
      </SafeAreaView>
    </Modal>
  );
}

const markdownStyles = {
  body: { color: colors.onSurfaceVariant, fontFamily: 'Manrope_500Medium', fontSize: 15, lineHeight: 23 },
  heading1: { color: colors.onSurface, fontFamily: 'Manrope_800ExtraBold', fontSize: 22, marginTop: 16, marginBottom: 8 },
  heading2: { color: colors.onSurface, fontFamily: 'Manrope_700Bold', fontSize: 19, marginTop: 14, marginBottom: 6 },
  heading3: { color: colors.onSurface, fontFamily: 'Manrope_700Bold', fontSize: 16, marginTop: 12, marginBottom: 6 },
  paragraph: { marginTop: 0, marginBottom: 12 },
  strong: { fontFamily: 'Manrope_700Bold', color: colors.onSurface },
  em: { fontStyle: 'italic' as const, color: colors.onSurface },
  bullet_list: { marginBottom: 12 },
  ordered_list: { marginBottom: 12 },
  list_item: { marginBottom: 6, flexDirection: 'row' as const },
  bullet_list_icon: { color: colors.primary, marginRight: 8 },
  ordered_list_icon: { color: colors.primary, marginRight: 8, fontFamily: 'Manrope_700Bold' },
  code_inline: {
    backgroundColor: colors.surfaceContainerHigh,
    color: colors.onSurface,
    fontFamily: 'Manrope_500Medium',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  code_block: {
    backgroundColor: colors.surfaceContainerHigh,
    color: colors.onSurface,
    padding: 12,
    borderRadius: 8,
  },
  fence: {
    backgroundColor: colors.surfaceContainerHigh,
    color: colors.onSurface,
    padding: 12,
    borderRadius: 8,
  },
  blockquote: {
    backgroundColor: colors.surfaceContainerHigh,
    borderLeftWidth: 3,
    borderLeftColor: colors.primaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
};
