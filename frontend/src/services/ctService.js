// Use runtime configuration with fallback to build-time environment variable
const getApiBaseUrl = () => {
  // First try runtime config (from env-config.js)
  if (typeof window !== 'undefined' && window._env_ && window._env_.REACT_APP_URL_API) {
    return window._env_.REACT_APP_URL_API;
  }
  // Fallback to build-time environment variable
  return process.env.REACT_APP_URL_API || 'http://109.196.102.193:5001';
};

const API_BASE_URL = 'http://109.196.102.193:5001/api/v1';

class CTService {
  /**
   * Upload a ZIP archive containing DICOM files
   * @param {File} archiveFile - The ZIP archive file
   * @param {number} patientId - Patient ID
   * @param {string} scanDate - Scan date in YYYY-MM-DD format
   * @param {string} description - Optional description
   * @returns {Promise<Object>} Upload result with file information
   */
  async uploadCTArchive(archiveFile, patientId, scanDate, description = '') {
    try {
      const formData = new FormData();
      formData.append('archive', archiveFile);
      formData.append('patient_id', patientId);
      formData.append('scan_date', scanDate);
      if (description) {
        formData.append('description', description);
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/ct/upload-archive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload CT archive');
      }

      const result = await response.json();
      console.log('CT archive uploaded successfully:', result);
      return result;
    } catch (error) {
      console.error('Error uploading CT archive:', error);
      throw error;
    }
  }

  /**
   * Get all unique scan dates for a patient
   * @param {number} patientId - Patient ID
   * @returns {Promise<Array>} Array of scan dates in YYYY-MM-DD format
   */
  async getPatientScanDates(patientId) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/ct/patient/${patientId}/scan-dates`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get scan dates');
      }

      const result = await response.json();
      return result.scanDates || [];
    } catch (error) {
      console.error('Error getting scan dates:', error);
      throw error;
    }
  }

  /**
   * Get all CT files for a patient for a specific scan date
   * @param {number} patientId - Patient ID
   * @param {string} scanDate - Scan date in YYYY-MM-DD format
   * @returns {Promise<Array>} Array of files
   */
  async getPatientFilesByDate(patientId, scanDate) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/ct/patient/${patientId}/files-by-date/${scanDate}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get files');
      }

      const result = await response.json();
      return result.files || [];
    } catch (error) {
      console.error('Error getting files by date:', error);
      throw error;
    }
  }

  /**
   * Download a file by ID
   * @param {number} fileId - File ID
   * @returns {Promise<Blob>} File content as blob
   */
  async downloadFile(fileId) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/files/download/${fileId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      return blob;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  /**
   * Get file URL for preview/download
   * @param {number} fileId - File ID
   * @returns {string} File URL
   */
  getFileUrl(fileId) {
    return `${API_BASE_URL}/files/download/${fileId}`;
  }
}

const ctService = new CTService();
export default ctService;
