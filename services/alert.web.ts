import type { AlertButton } from 'react-native';

export const Alert = {
  alert(title: string, message?: string, buttons?: AlertButton[]): void {
    const text = message ? `${title}\n\n${message}` : title;

    if (!buttons || buttons.length < 2) {
      window.alert(text);
      buttons?.[0]?.onPress?.();
      return;
    }

    const cancelButton = buttons.find((button) => button.style === 'cancel') ?? buttons[0];
    const actionButtons = buttons.filter((button) => button !== cancelButton);
    const actionButton = actionButtons[actionButtons.length - 1];

    if (window.confirm(text)) {
      actionButton.onPress?.();
    } else {
      cancelButton.onPress?.();
    }
  },
};
