// Browsers save PDFs through their print dialog, so the report opens in a tab ready to print.
export const outputReport = async (html: string): Promise<void> => {
  const reportWindow = window.open('', '_blank');
  if (!reportWindow) throw new Error('Please allow pop-ups to open the report.');
  reportWindow.document.open();
  reportWindow.document.write(html);
  reportWindow.document.close();
  reportWindow.focus();
  reportWindow.print();
};
