import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// Renders to a PDF in the app's cache and opens the phone's share sheet.
export const outputReport = async (html: string): Promise<void> => {
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  } else {
    await Print.printAsync({ uri });
  }
};
