export const createFullHTMLPresentation = (data) => {
  const slides = data.slides || [];
  
  return `
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ортодонтическая презентация: ${data.patient?.fullName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            background: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }
        
        .presentation-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .slide {
            background: white;
            width: 100%;
            aspect-ratio: 16 / 9;
            margin-bottom: 40px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            position: relative;
            page-break-after: always;
        }
        
        .slide-header {
            background: #1e293b;
            color: white;
            padding: 20px 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .slide-title {
            font-size: 24px;
            font-weight: bold;
        }
        
        .slide-number {
            font-size: 14px;
            opacity: 0.7;
        }
        
        .slide-content {
            flex: 1;
            padding: 40px;
            display: flex;
            flex-direction: column;
        }
        
        .slide-footer {
            padding: 10px 40px;
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            color: #64748b;
        }
        
        /* Типы слайдов */
        .slide-title-page {
            justify-content: center;
            align-items: center;
            text-align: center;
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            color: white;
        }
        
        .title-main {
            font-size: 48px;
            margin-bottom: 20px;
        }
        
        .title-sub {
            font-size: 24px;
            opacity: 0.9;
            margin-bottom: 40px;
        }
        
        .patient-info-box {
            background: rgba(255,255,255,0.1);
            padding: 30px;
            border-radius: 12px;
            backdrop-filter: blur(5px);
            text-align: left;
            min-width: 400px;
        }
        
        .info-row {
            margin-bottom: 10px;
            display: flex;
        }
        
        .info-label {
            font-weight: bold;
            width: 150px;
            opacity: 0.8;
        }
        
        .grid-photos {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            height: 100%;
        }
        
        .photo-placeholder {
            background: #f1f5f9;
            border: 2px dashed #cbd5e1;
            border-radius: 8px;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 14px;
            color: #94a3b8;
            height: 100%;
            min-height: 200px;
        }
        
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        .data-table th, .data-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .data-table th {
            background: #f8fafc;
            font-weight: bold;
        }
        
        .conclusion-list {
            list-style: none;
        }
        
        .conclusion-item {
            padding: 10px 0;
            border-bottom: 1px solid #f1f5f9;
            display: flex;
            align-items: flex-start;
        }
        
        .conclusion-item::before {
            content: "•";
            color: #3b82f6;
            font-weight: bold;
            margin-right: 10px;
        }

        @media print {
            body { background: white; }
            .presentation-container { padding: 0; max-width: none; }
            .slide { margin-bottom: 0; box-shadow: none; border-radius: 0; }
        }
    </style>
</head>
<body>
    <div class="presentation-container">
        ${slides.map(slide => renderSlideHTML(slide)).join('')}
    </div>
</body>
</html>
  `;
};

const renderSlideHTML = (slide) => {
  const { title, type, content, number } = slide;
  
  let contentHtml = '';
  
  switch(type) {
    case 'title':
      contentHtml = `
        <div class="slide-content slide-title-page">
            <h1 class="title-main">${title}</h1>
            <p class="title-sub">Клинический случай</p>
            <div class="patient-info-box">
                <div class="info-row">
                    <span class="info-label">Пациент:</span>
                    <span>${content.patientName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Дата рожд.:</span>
                    <span>${content.birthDate}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Обследование:</span>
                    <span>${content.examinationDate}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Врач:</span>
                    <span>${content.doctor}</span>
                </div>
            </div>
        </div>
      `;
      break;
    case 'anamnesis':
      contentHtml = `
        <div class="slide-header">
            <div class="slide-title">${title}</div>
            <div class="slide-number">Слайд ${number}</div>
        </div>
        <div class="slide-content">
            <table class="data-table">
                <tr><th>Параметр</th><th>Значение</th></tr>
                <tr><td>Роды</td><td>${content.birthType || 'в срок'}</td></tr>
                <tr><td>Вскармливание</td><td>${content.feedingType?.type || 'естественное'}</td></tr>
                <tr><td>Смена зубов</td><td>${content.teethChangeYears || 6} лет</td></tr>
                <tr><td>Общее состояние</td><td>${content.generalHealth || 'удовлетворительное'}</td></tr>
            </table>
        </div>
      `;
      break;
    case 'frontal_photos':
    case 'profile_photos':
      contentHtml = `
        <div class="slide-header">
            <div class="slide-title">${title}</div>
            <div class="slide-number">Слайд ${number}</div>
        </div>
        <div class="slide-content">
            <div class="grid-photos">
                ${(content.photos || []).map(p => `<div class="photo-placeholder">ФОТО: ${p}</div>`).join('')}
            </div>
            <div style="margin-top: 20px; padding: 15px; background: #f0f7ff; border-radius: 8px;">
                <strong>Анализ:</strong> ${content.analysis?.comments || 'Данные анализируются...'}
            </div>
        </div>
      `;
      break;
    case 'diagnosis':
      contentHtml = `
        <div class="slide-header">
            <div class="slide-title">${title}</div>
            <div class="slide-number">Слайд ${number}</div>
        </div>
        <div class="slide-content">
            <div class="diagnosis-list">
                ${(content.diagnoses || []).map(d => `
                    <div style="margin-bottom: 15px; padding-left: 15px; border-left: 4px solid #3b82f6;">
                        <div style="font-weight: bold;">${d.diagnosis}</div>
                        <div style="font-size: 0.9em; color: #64748b;">${d.code} | Тяжесть: ${d.severity}</div>
                    </div>
                `).join('')}
            </div>
        </div>
      `;
      break;
    case 'conclusions':
      contentHtml = `
        <div class="slide-header">
            <div class="slide-title">${title}</div>
            <div class="slide-number">Слайд ${number}</div>
        </div>
        <div class="slide-content">
            <ul class="conclusion-list">
                ${(content.conclusions || []).map(c => `<li class="conclusion-item">${c}</li>`).join('')}
            </ul>
        </div>
      `;
      break;
    case 'lateral_trg':
      contentHtml = `
        <div class="slide-header">
            <div class="slide-title">${title}</div>
            <div class="slide-number">Слайд ${number}</div>
        </div>
        <div class="slide-content">
            <p><strong>Скелетный класс:</strong> ${content.skeletalClass}</p>
            <table class="data-table">
                <tr><th>Параметр</th><th>Значение</th><th>Норма</th><th>Интерпретация</th></tr>
                ${Object.entries(content.parameters || {}).map(([key, val]) => `
                    <tr><td>${key}</td><td>${val.value}</td><td>${val.norm}</td><td>${val.interpretation}</td></tr>
                `).join('')}
            </table>
        </div>
      `;
      break;
    case 'airway':
    case 'optg':
      contentHtml = `
        <div class="slide-header">
            <div class="slide-title">${title}</div>
            <div class="slide-number">Слайд ${number}</div>
        </div>
        <div class="slide-content" style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <div style="width: 80%; height: 60%; background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #94a3b8;">
                [ИЗОБРАЖЕНИЕ: ${type === 'airway' ? 'Воздухоносные пути' : 'ОПТГ'}]
            </div>
            <p style="margin-top: 20px; font-weight: bold;">${content.findings || content.airwayStatus || 'Результат анализа'}</p>
        </div>
      `;
      break;
    default:
      contentHtml = `
        <div class="slide-header">
            <div class="slide-title">${title}</div>
            <div class="slide-number">Слайд ${number}</div>
        </div>
        <div class="slide-content">
            <div style="display: flex; justify-content: center; align-items: center; height: 100%; color: #94a3b8; border: 2px dashed #e2e8f0; border-radius: 12px;">
                Контент для типа "${type}" будет сгенерирован при экспорте
            </div>
        </div>
      `;
  }
  
  return `
    <div class="slide">
        ${contentHtml}
        <div class="slide-footer">
            <span>Picasso Diagnostic Center</span>
            <span>${new Date().toLocaleDateString()}</span>
        </div>
    </div>
  `;
};
