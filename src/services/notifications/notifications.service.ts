import * as SecureStore from "expo-secure-store";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";
import type * as NotificationsModule from "expo-notifications";

const REMINDER_ID_KEY = "elix_reminder_notification_id";
const REMINDER_TIME_KEY = "elix_reminder_time";
const ANDROID_CHANNEL_ID = "lembretes-revisao";

const NOTIFICATIONS_DISPONIVEIS = Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

// expo-notifications não funciona dentro do Expo Go a partir do SDK 53 (só em
// dev build) — e diferente da maioria dos módulos nativos, só o IMPORT dele já
// dispara um erro que trava a tela lá, antes de qualquer função ser chamada.
// Por isso o require() é condicional (não um `import` estático no topo do
// arquivo): um `import` sempre executa o módulo, mesmo dentro de um `if`; um
// `require()` só executa quando essa linha realmente roda.
const Notifications: typeof NotificationsModule | null = NOTIFICATIONS_DISPONIVEIS
  ? require("expo-notifications")
  : null;

// Notificação em primeiro plano também aparece como banner — sem isso, o app
// aberto silenciaria o próprio lembrete que acabou de agendar.
if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export const NotificationsService = {
  /** false só quando é uma limitação do ambiente (Expo Go), não permissão negada. */
  isAvailable: NOTIFICATIONS_DISPONIVEIS,

  /** Pede permissão ao SO (se ainda não concedida). Retorna se pode notificar. */
  async requestPermission(): Promise<boolean> {
    if (!Notifications) return false;

    const { status: atual } = await Notifications.getPermissionsAsync();
    if (atual === "granted") return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  },

  /**
   * Agenda o lembrete diário no horário escolhido (repete todo dia). Cancela
   * qualquer lembrete agendado anteriormente antes de criar o novo, pra nunca
   * ficar com dois horários ativos ao mesmo tempo.
   */
  async scheduleDailyReminder(hour: number, minute: number): Promise<void> {
    if (!Notifications) return;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: "Lembretes de revisão",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    await this.cancelReminder();

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Hora de revisar 🧪",
        body: "Sua dose diária te espera — alguns minutos hoje valem semanas de memória.",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: Platform.OS === "android" ? ANDROID_CHANNEL_ID : undefined,
      },
    });

    await SecureStore.setItemAsync(REMINDER_ID_KEY, id);
    await SecureStore.setItemAsync(REMINDER_TIME_KEY, `${hour}:${minute}`);
  },

  async cancelReminder(): Promise<void> {
    if (!Notifications) return;

    const previousId = await SecureStore.getItemAsync(REMINDER_ID_KEY);
    if (previousId) {
      await Notifications.cancelScheduledNotificationAsync(previousId);
      await SecureStore.deleteItemAsync(REMINDER_ID_KEY);
    }
  },

  /** Horário salvo localmente (se já houver um lembrete configurado). */
  async getSavedReminderTime(): Promise<{ hour: number; minute: number } | null> {
    const raw = await SecureStore.getItemAsync(REMINDER_TIME_KEY);
    if (!raw) return null;

    const [hour, minute] = raw.split(":").map(Number);
    return { hour, minute };
  },
};
