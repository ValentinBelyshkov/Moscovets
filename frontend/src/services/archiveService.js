import JSZip from 'jszip';
import localFileService from './localFileService';

class ArchiveService {
  constructor() {
    this.supportedFormats = ['.zip', '.rar', '.7z', '.tar', '.gz'];
    this.maxArchiveSize = 500 * 1024 * 1024; // 500MB максимальный размер архива
  }

  // Проверка поддерживаемого формата архива
  isSupportedArchive(filename) {
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return extension === '.zip'; // Пока поддерживаем только ZIP
  }

  // Распаковка ZIP архива
  async extractZipArchive(file) {
    try {
      // Проверяем размер архива
      if (file.size > this.maxArchiveSize) {
        throw new Error(`Размер архива превышает допустимый лимит (${this.maxArchiveSize / (1024 * 1024)}MB)`);
      }

      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);
      
      const extractedFiles = [];
      const dicomFiles = [];
      
      // Проходим по всем файлам в архиве
      for (const [relativePath, zipEntry] of Object.entries(zipContent.files || {})) {
        // Пропускаем директории
        if (zipEntry.dir) {
          continue;
        }
        
        // Проверяем, является ли файл DICOM
        const fileName = zipEntry.name.toLowerCase();
        if (fileName.endsWith('.dcm') || fileName.includes('dicom')) {
          try {
            const blob = await zipEntry.async('blob');
            const file = new File([blob], zipEntry.name, {
              type: 'application/dicom',
              lastModified: zipEntry.date?.getTime() || Date.now()
            });
            
            dicomFiles.push(file);
            extractedFiles.push({
              name: zipEntry.name,
              path: relativePath,
              size: file.size,
              type: file.type,
              file: file
            });
          } catch (error) {
            console.warn(`Не удалось извлечь файл ${zipEntry.name}:`, error);
          }
        }
      }
      
      if (dicomFiles.length === 0) {
        throw new Error('В архиве не найдено DICOM файлов (.dcm)');
      }
      
      console.log(`Извлечено ${dicomFiles.length} DICOM файлов из архива`);
      
      return {
        success: true,
        dicomFiles: dicomFiles,
        extractedFiles: extractedFiles,
        totalFiles: extractedFiles.length
      };
      
    } catch (error) {
      console.error('Ошибка при распаковке архива:', error);
      throw new Error(`Ошибка при распаковке архива: ${error.message}`);
    }
  }

  // Обработка загрузки архива и извлечение DICOM файлов
  async processArchiveUpload(archiveFile, patientId = 1) {
    try {
      // Проверяем, что это поддерживаемый формат архива
      if (!this.isSupportedArchive(archiveFile.name)) {
        throw new Error('Поддерживаются только ZIP архивы. Пожалуйста, загрузите ZIP файл содержащий DICOM файлы.');
      }
      
      // Распаковываем архив
      const extractionResult = await this.extractZipArchive(archiveFile);
      
      if (!extractionResult.success || extractionResult.dicomFiles.length === 0) {
        throw new Error('Не удалось извлечь DICOM файлы из архива');
      }
      
      // Загружаем извлеченные DICOM файлы в систему
      const uploadPromises = extractionResult.dicomFiles.map(file =>
        localFileService.uploadFile(file, patientId, 'CT Scan from archive')
      );
      
      const uploadedFiles = await Promise.all(uploadPromises);
      
      return {
        success: true,
        uploadedFiles: uploadedFiles,
        dicomFiles: extractionResult.dicomFiles,
        totalExtracted: extractionResult.totalFiles
      };
      
    } catch (error) {
      console.error('Ошибка при обработке архива:', error);
      throw error;
    }
  }

  // Валидация архива перед загрузкой
  validateArchive(file) {
    const errors = [];
    
    // Проверяем размер файла
    if (file.size > this.maxArchiveSize) {
      errors.push(`Размер архива (${(file.size / (1024 * 1024)).toFixed(2)}MB) превышает допустимый лимит (${this.maxArchiveSize / (1024 * 1024)}MB)`);
    }
    
    // Проверяем формат
    if (!this.isSupportedArchive(file.name)) {
      errors.push(`Формат файла не поддерживается. Поддерживаемые форматы: ${this.supportedFormats.join(', ')}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Получение информации об архиве
  async getArchiveInfo(file) {
    try {
      if (!this.isSupportedArchive(file.name)) {
        throw new Error('Неподдерживаемый формат архива');
      }
      
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);
      
      const files = [];
      let dicomCount = 0;
      let totalSize = 0;
      
      for (const [relativePath, zipEntry] of Object.entries(zipContent.files || {})) {
        if (!zipEntry.dir) {
          const fileName = zipEntry.name.toLowerCase();
          const isDicom = fileName.endsWith('.dcm') || fileName.includes('dicom');
          
          if (isDicom) {
            dicomCount++;
          }
          
          totalSize += zipEntry._data?.uncompressedSize || 0;
          
          files.push({
            name: zipEntry.name,
            path: relativePath,
            size: zipEntry._data?.uncompressedSize || 0,
            isDicom: isDicom,
            isDirectory: zipEntry.dir,
            date: zipEntry.date
          });
        }
      }
      
      return {
        filename: file.name,
        size: file.size,
        uncompressedSize: totalSize,
        totalFiles: files.length,
        dicomFiles: dicomCount,
        files: files
      };
      
    } catch (error) {
      console.error('Ошибка при получении информации об архиве:', error);
      throw new Error(`Не удалось прочитать архив: ${error.message}`);
    }
  }
}

const archiveService = new ArchiveService();
export default archiveService;