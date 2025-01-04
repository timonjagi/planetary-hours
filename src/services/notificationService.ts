import {LocalNotifications} from '@capacitor/local-notifications';

export const scheduleNotification = async (
  title: string,
  body: string,
  scheduleTime: Date
) => {
  await LocalNotifications.schedule({
    notifications: [
      {
        title,
        body,
        id: new Date().getTime(),
        schedule: {at: scheduleTime},
        sound: 'default',
        actionTypeId: '',
        extra: null,
      },
    ],
  });
};

export const requestPermissions = async () => {
  const result = await LocalNotifications.requestPermissions();
  return result.display === 'granted';
};
