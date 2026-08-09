import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const downloadReceipt = async (elementId: string, filename: string = 'receipt') => {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Failed to download PDF:', error);
  }
};
