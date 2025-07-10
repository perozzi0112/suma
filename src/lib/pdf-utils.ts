
interface PDFReportParams {
  title: string;
  subtitle: string;
  sections: {
    title: string;
    columns: string[];
    data: (string | number)[][];
  }[];
  fileName: string;
}

export async function generatePdfReport({ title, subtitle, sections, fileName }: PDFReportParams) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();
  
  // This is a placeholder for a real logo
  const logoBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAADe701jAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAFDSURBVEhL7dfBEcIwDIBhL+kGbjVn8Aiu4AZiA9+FicAUnEQUYJzD4S+i9Nq29ZCSLCSl/8/VUhEymBwB9jHgTe8/j+mcl/A7QA4AOZq02w2E9Hwb2y8cRekkKz63P9/l2ABHCsgx3QhAAsiR6wA4gIpU13nC5wYwP5uW0j+MTh9AgCO1Y1AJK5JzHSAAUlXCAHEIGoBqAbQyZAC0Ek4nAOgAJN8fAHER+J0LkFQAJNcdaW0ACeCg1OsdANR9K84XANoCyL+vBNAVgHxPABR8b9YnAHSMv+xYAMBLeOOMh+0A3AZErP8UAGTAE5BkjwAQgE4ksw9ALABGB6KcrwAYgQ5kRyrfgPgAyoEaBEx/0RribcTjA0DrOsa6q718QNcJsIe33QEWxURT/vX3PxpI+S8sIgm7d6gJJQUAAAANSURBVO2/MQoAIAgE4P+no0Yc0cTz3RiTRAGtZXuD5bO2fAcxApODEwD2A68L0M5H4vYCWb8A0pEy+oQoKWuPqAUAmAA4AFQBSL8A0AmkHwBoACQQfAQAoQLoVAAoC8A8AGQCyPQBSVoB2lUTAAAANSURBVO2/MQoAIAgE4P+no0Yc0cTz3RiTRAGtZXuD5bO2fAcxApODEwD2A68L0M5H4vYCWb8A0pEy+oQoKWuPqAUAmAA4AFQBSL8A0AmkHwBoACQQfAQAoQLoVAAoC8A8AGQCyPQBSVoB2lUTAAAANSURBVO2/MQoAIAgE4P+no0Yc0cTz3RiTRAGtZXuD5bO2fAcxApODEwD2A68L0M5H4vYCWb8A0pEy+oQoKWuPqAUAmAA4AFQBSL8A0AmkHwBoACQQfAQAoQLoVAAoC8A8AGQCyPQBSVoB2lUTAAAANSURBVO2/MQoAIAgE4P+no0Yc0cTz3RiTRAGtZXuD5bO2fAcxApODEwD2A68L0M5H4vYCWb8A0pEy+oQoKWuPqAUAmAA4AFQBSL8A0AmkHwBoACQQfAQAoQLoVAAoC8A8AGQCyPQBSVoB2lUTAAAANSURBVO2/MQoAIAgE4P+no0Yc0cTz3RiTRAGtZXuD5bO2fAcxApODEwD2A68L0M5H4vYCWb8A0pEy+oQoKWuPqAUAmAA4AFQBSL8A0AmkHwBoACQQfAQAoQLoVAAoC8A8AGQCyPQBSVoB2lUTAAAANSURBVO2/MQoAIAgE4P+no0Yc0cTz3RiTRAGtZXuD5bO2fAcxApODEwD2A68L0M5H4vYCWb8A0pEy+o-KKtr5cZfK1I9IAAAAASUVORK5CYII=";

  doc.addImage(logoBase64, 'PNG', 14, 15, 10, 10);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("SUMA - Sistema Unificado de Medicina Avanzada", 28, 22);

  doc.setFontSize(16);
  doc.setFont("helvetica", "normal");
  doc.text(title, 14, 40);
  doc.setFontSize(10);
  doc.text(subtitle, 14, 46);

  let currentY = 55;

  sections.forEach(section => {
    if (doc.internal.pageSize.height - currentY < 40) { // Check if space is enough
        doc.addPage();
        currentY = 20;
    }

    doc.setFontSize(14);
    doc.text(section.title, 14, currentY);
    currentY += 2;
    doc.line(14, currentY, 196, currentY); // separator
    currentY += 8;
    
    autoTable(doc, {
        startY: currentY,
        head: [section.columns],
        body: section.data,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] }
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 15;
  });

  doc.save(fileName);
}
