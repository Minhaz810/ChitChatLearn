/**
 * API Service for communicating with the backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = localStorage.getItem('token');

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        if (response.status === 401) {
          // Handle unauthorized, maybe redirect to login or refresh token
          // For now, let's just throw the error
        }
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error: ${endpoint}`, error);
      throw error;
    }
  }

  // Auth endpoints
  async signup(data) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async refreshToken(refreshToken) {
    return this.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  }

  // Vocabulary endpoints
  async importVocabulary(data) {
    return this.request('/vocabulary/import', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getChunks() {
    return this.request('/vocabulary/chunks');
  }

  async getWords(chunkId = null, page = 1, size = 50) {
    const params = new URLSearchParams();
    if (chunkId) params.append('chunk_id', chunkId);
    params.append('page', page);
    params.append('size', size);
    return this.request(`/vocabulary/words?${params.toString()}`);
  }

  async getWord(wordId) {
    return this.request(`/vocabulary/words/${wordId}`);
  }

  // Progress endpoints
  async getOverallProgress() {
    return this.request('/vocabulary/progress/overall');
  }

  async getWordProgress(wordId) {
    return this.request(`/vocabulary/progress/${wordId}`);
  }

  async getQuestionHistory(limit = 50) {
    return this.request(`/vocabulary/history/all?limit=${limit}`);
  }

  async getWordHistory(wordId) {
    return this.request(`/vocabulary/history/${wordId}`);
  }

  // Answer submission (for web testing)
  async submitAnswer(sessionId, answer) {
    return this.request('/webhook/answer', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, answer }),
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Scheduler settings endpoints
  async getSchedulerSettings() {
    return this.request('/settings/scheduler');
  }

  async updateSchedulerSettings(settings) {
    return this.request('/settings/scheduler', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async pauseScheduler() {
    return this.request('/settings/scheduler/pause', {
      method: 'POST',
    });
  }

  async resumeScheduler() {
    return this.request('/settings/scheduler/resume', {
      method: 'POST',
    });
  }
}

export const api = new ApiService(API_BASE_URL);
export default api;
