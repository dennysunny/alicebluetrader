import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { API_BASE_URL, API_TIMEOUT, ERROR_CODES } from '../constants';
import { Logger } from '../utils/logger';
import type { ApiResponse } from '../types';

// ============================================================
// CUSTOM API ERROR
// ============================================================

export class ApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly data?: unknown;

  constructor(message: string, code: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.data = data;
  }
}

// ============================================================
// RETRY CONFIGURATION
// ============================================================

interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryCondition: (error: ApiError) => boolean;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  retryCondition: (error) =>
    error.status >= 500 || error.code === ERROR_CODES.NETWORK_ERROR,
};

// ============================================================
// HTTP CLIENT CLASS
// ============================================================

class HttpClient {
  private instance: AxiosInstance;
  private tokenProvider: (() => string | null) | null = null;
  private onUnauthorized: (() => void) | null = null;

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.setupInterceptors();
  }

  // Inject token provider from auth store (avoids circular dep)
  setTokenProvider(provider: () => string | null): void {
    this.tokenProvider = provider;
  }

  setUnauthorizedHandler(handler: () => void): void {
    this.onUnauthorized = handler;
  }

  private setupInterceptors(): void {
    // Request interceptor - attach auth token
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (this.tokenProvider) {
          const token = this.tokenProvider();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        Logger.debug('API Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          data: config.data,
        });

        return config;
      },
      (error: unknown) => Promise.reject(error),
    );

    // Response interceptor - normalize responses + handle errors
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        Logger.debug('API Response', {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      (error: unknown) => {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status ?? 0;
          const data = error.response?.data;

          if (status === 401 || status === 403) {
            this.onUnauthorized?.();
            return Promise.reject(
              new ApiError(
                'Session expired. Please login again.',
                ERROR_CODES.SESSION_EXPIRED,
                status,
                data,
              ),
            );
          }

          if (!error.response) {
            return Promise.reject(
              new ApiError(
                'Network error. Please check your connection.',
                ERROR_CODES.NETWORK_ERROR,
                0,
              ),
            );
          }

          const message =
            (data as ApiResponse<unknown>)?.message ||
            error.message ||
            'Something went wrong';

          return Promise.reject(
            new ApiError(message, ERROR_CODES.UNKNOWN, status, data),
          );
        }

        return Promise.reject(
          new ApiError(
            'An unexpected error occurred',
            ERROR_CODES.UNKNOWN,
            0,
          ),
        );
      },
    );
  }

  private async withRetry<T>(
    fn: () => Promise<T>,
    config: RetryConfig = DEFAULT_RETRY_CONFIG,
    attempt = 0,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (
        error instanceof ApiError &&
        attempt < config.maxRetries &&
        config.retryCondition(error)
      ) {
        const delay = config.retryDelay * Math.pow(2, attempt); // exponential backoff
        Logger.warn(`Retrying request (${attempt + 1}/${config.maxRetries})`, {
          delay,
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.withRetry(fn, config, attempt + 1);
      }
      throw error;
    }
  }

  async get<T>(
    url: string,
    config?: AxiosRequestConfig,
    retry?: Partial<RetryConfig>,
  ): Promise<T> {
    return this.withRetry(async () => {
      const response = await this.instance.get<ApiResponse<T>>(url, config);
      return this.extractData<T>(response);
    }, { ...DEFAULT_RETRY_CONFIG, ...retry });
  }

  async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
    retry?: Partial<RetryConfig>,
  ): Promise<T> {
    return this.withRetry(async () => {
      const response = await this.instance.post<ApiResponse<T>>(
        url,
        data,
        config,
      );
      return this.extractData<T>(response);
    }, { ...DEFAULT_RETRY_CONFIG, ...retry });
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.withRetry(async () => {
      const response = await this.instance.put<ApiResponse<T>>(url, data, config);
      return this.extractData<T>(response);
    });
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.withRetry(async () => {
      const response = await this.instance.delete<ApiResponse<T>>(url, config);
      return this.extractData<T>(response);
    });
  }

  private extractData<T>(response: AxiosResponse<ApiResponse<T>>): T {
    const { data } = response;

    if (data.status === 'Not Ok') {
      throw new ApiError(
        data.message || 'API returned an error',
        data.errorCode || ERROR_CODES.UNKNOWN,
        response.status,
        data,
      );
    }

    return data.result as T;
  }
}

export const httpClient = new HttpClient();
