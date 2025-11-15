/**
 * Example Service Implementation cho Leave Requests API
 * Đây là ví dụ về cách implement service trong Frontend
 * Có thể sử dụng với Axios, Fetch API, hoặc bất kỳ HTTP client nào
 */

import {
  CreateLeaveRequestDto,
  RejectLeaveRequestDto,
  CancelLeaveRequestDto,
  QueryLeaveRequestDto,
  LeaveRequest,
  LeaveRequestListResponse,
  LeaveRequestDetailResponse,
  LeaveRequestCreateResponse,
  LeaveRequestApproveResponse,
  LeaveRequestRejectResponse,
  LeaveRequestCancelResponse,
  ApiError,
} from './LEAVE_REQUESTS_TYPES';

// ============================================
// Configuration
// ============================================

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const API_PATH = '/leave-requests';

// ============================================
// Helper: Get Auth Token
// ============================================

const getAuthToken = (): string | null => {
  // Lấy token từ localStorage, sessionStorage, hoặc context
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// ============================================
// Helper: Handle API Response
// ============================================

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      statusCode: response.status,
      message: response.statusText,
      error: 'Unknown Error',
    }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// ============================================
// Service Class (Axios Example)
// ============================================

import axios, { AxiosInstance } from 'axios';

class LeaveRequestsService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to all requests
    this.api.interceptors.request.use((config) => {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          throw new Error(
            error.response.data?.message || error.response.statusText,
          );
        }
        throw error;
      },
    );
  }

  /**
   * Tạo đơn xin nghỉ
   */
  async create(
    data: CreateLeaveRequestDto,
  ): Promise<LeaveRequestCreateResponse> {
    const response = await this.api.post<LeaveRequestCreateResponse>(
      API_PATH,
      data,
    );
    return response.data;
  }

  /**
   * Lấy danh sách đơn xin nghỉ của tôi
   */
  async getMyRequests(page = 1, limit = 10): Promise<LeaveRequestListResponse> {
    const response = await this.api.get<LeaveRequestListResponse>(API_PATH, {
      params: { page, limit },
    });
    return response.data;
  }

  /**
   * Lấy tất cả đơn xin nghỉ với filter (Admin/Manager)
   */
  async getAll(
    query?: QueryLeaveRequestDto,
  ): Promise<LeaveRequestListResponse> {
    const response = await this.api.get<LeaveRequestListResponse>(
      `${API_PATH}/all`,
      { params: query },
    );
    return response.data;
  }

  /**
   * Lấy chi tiết đơn xin nghỉ
   */
  async getById(id: string): Promise<LeaveRequestDetailResponse> {
    const response = await this.api.get<LeaveRequestDetailResponse>(
      `${API_PATH}/${id}`,
    );
    return response.data;
  }

  /**
   * Duyệt đơn xin nghỉ (Admin/Manager)
   */
  async approve(id: string): Promise<LeaveRequestApproveResponse> {
    const response = await this.api.patch<LeaveRequestApproveResponse>(
      `${API_PATH}/${id}/approve`,
    );
    return response.data;
  }

  /**
   * Từ chối đơn xin nghỉ (Admin/Manager)
   */
  async reject(
    id: string,
    data: RejectLeaveRequestDto,
  ): Promise<LeaveRequestRejectResponse> {
    const response = await this.api.patch<LeaveRequestRejectResponse>(
      `${API_PATH}/${id}/reject`,
      data,
    );
    return response.data;
  }

  /**
   * Hủy đơn xin nghỉ (Employee)
   */
  async cancel(
    id: string,
    data: CancelLeaveRequestDto,
  ): Promise<LeaveRequestCancelResponse> {
    const response = await this.api.patch<LeaveRequestCancelResponse>(
      `${API_PATH}/${id}/cancel`,
      data,
    );
    return response.data;
  }

  /**
   * Cập nhật đơn xin nghỉ (Employee)
   */
  async update(
    id: string,
    data: CreateLeaveRequestDto,
  ): Promise<LeaveRequestCreateResponse> {
    const response = await this.api.patch<LeaveRequestCreateResponse>(
      `${API_PATH}/${id}`,
      data,
    );
    return response.data;
  }

  /**
   * Xóa đơn xin nghỉ (Admin)
   */
  async delete(id: string): Promise<LeaveRequest> {
    const response = await this.api.delete<LeaveRequest>(`${API_PATH}/${id}`);
    return response.data;
  }
}

// Export singleton instance
export const leaveRequestsService = new LeaveRequestsService();

// ============================================
// Alternative: Functional Approach (Fetch API)
// ============================================

export const leaveRequestsAPI = {
  /**
   * Tạo đơn xin nghỉ
   */
  create: async (
    data: CreateLeaveRequestDto,
  ): Promise<LeaveRequestCreateResponse> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}${API_PATH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });
    return handleResponse<LeaveRequestCreateResponse>(response);
  },

  /**
   * Lấy danh sách đơn xin nghỉ của tôi
   */
  getMyRequests: async (
    page = 1,
    limit = 10,
  ): Promise<LeaveRequestListResponse> => {
    const token = getAuthToken();
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await fetch(`${API_BASE_URL}${API_PATH}?${queryParams}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return handleResponse<LeaveRequestListResponse>(response);
  },

  /**
   * Lấy tất cả đơn xin nghỉ với filter (Admin/Manager)
   */
  getAll: async (
    query?: QueryLeaveRequestDto,
  ): Promise<LeaveRequestListResponse> => {
    const token = getAuthToken();
    const queryParams = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const response = await fetch(
      `${API_BASE_URL}${API_PATH}/all?${queryParams}`,
      {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      },
    );
    return handleResponse<LeaveRequestListResponse>(response);
  },

  /**
   * Lấy chi tiết đơn xin nghỉ
   */
  getById: async (id: string): Promise<LeaveRequestDetailResponse> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}${API_PATH}/${id}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return handleResponse<LeaveRequestDetailResponse>(response);
  },

  /**
   * Duyệt đơn xin nghỉ (Admin/Manager)
   */
  approve: async (id: string): Promise<LeaveRequestApproveResponse> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}${API_PATH}/${id}/approve`, {
      method: 'PATCH',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return handleResponse<LeaveRequestApproveResponse>(response);
  },

  /**
   * Từ chối đơn xin nghỉ (Admin/Manager)
   */
  reject: async (
    id: string,
    data: RejectLeaveRequestDto,
  ): Promise<LeaveRequestRejectResponse> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}${API_PATH}/${id}/reject`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });
    return handleResponse<LeaveRequestRejectResponse>(response);
  },

  /**
   * Hủy đơn xin nghỉ (Employee)
   */
  cancel: async (
    id: string,
    data: CancelLeaveRequestDto,
  ): Promise<LeaveRequestCancelResponse> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}${API_PATH}/${id}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });
    return handleResponse<LeaveRequestCancelResponse>(response);
  },

  /**
   * Cập nhật đơn xin nghỉ (Employee)
   */
  update: async (
    id: string,
    data: CreateLeaveRequestDto,
  ): Promise<LeaveRequestCreateResponse> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}${API_PATH}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });
    return handleResponse<LeaveRequestCreateResponse>(response);
  },

  /**
   * Xóa đơn xin nghỉ (Admin)
   */
  delete: async (id: string): Promise<LeaveRequest> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}${API_PATH}/${id}`, {
      method: 'DELETE',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return handleResponse<LeaveRequest>(response);
  },
};

// ============================================
// Usage Examples
// ============================================

/*
// Example 1: Using Class-based Service (Axios)
import { leaveRequestsService } from './LEAVE_REQUESTS_SERVICE_EXAMPLE';

// Tạo đơn xin nghỉ
try {
  const newLeave = await leaveRequestsService.create({
    startDate: '2024-01-15T00:00:00.000Z',
    endDate: '2024-01-17T00:00:00.000Z',
    reason: 'Nghỉ phép cá nhân',
  });
  console.log('Đơn xin nghỉ đã được tạo:', newLeave);
} catch (error) {
  console.error('Lỗi khi tạo đơn:', error.message);
}

// Lấy danh sách đơn của tôi
const myLeaves = await leaveRequestsService.getMyRequests(1, 10);
console.log('Danh sách đơn:', myLeaves.data);
console.log('Tổng số:', myLeaves.meta.total);

// Duyệt đơn
await leaveRequestsService.approve('clx1234567890');

// Từ chối đơn
await leaveRequestsService.reject('clx1234567890', {
  rejectedReason: 'Không đủ số ngày nghỉ phép',
});

// ============================================

// Example 2: Using Functional API (Fetch)
import { leaveRequestsAPI } from './LEAVE_REQUESTS_SERVICE_EXAMPLE';

// Tạo đơn xin nghỉ
const newLeave = await leaveRequestsAPI.create({
  startDate: '2024-01-15T00:00:00.000Z',
  endDate: '2024-01-17T00:00:00.000Z',
  reason: 'Nghỉ phép cá nhân',
});

// Lấy danh sách với filter (Admin)
const allLeaves = await leaveRequestsAPI.getAll({
  page: 1,
  limit: 20,
  status: 'PENDING',
  startDateFrom: '2024-01-01T00:00:00.000Z',
  endDateTo: '2024-12-31T23:59:59.999Z',
});

// ============================================

// Example 3: React Hook
import { useState, useEffect } from 'react';
import { leaveRequestsService } from './LEAVE_REQUESTS_SERVICE_EXAMPLE';
import { LeaveRequestListResponse } from './LEAVE_REQUESTS_TYPES';

function useMyLeaveRequests(page = 1, limit = 10) {
  const [data, setData] = useState<LeaveRequestListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await leaveRequestsService.getMyRequests(page, limit);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, limit]);

  return { data, loading, error };
}

// Usage in component
function MyLeaveRequestsComponent() {
  const { data, loading, error } = useMyLeaveRequests(1, 10);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return null;

  return (
    <div>
      <h2>Đơn xin nghỉ của tôi</h2>
      <p>Tổng số: {data.meta.total}</p>
      {data.data.map((leave) => (
        <div key={leave.id}>
          <p>
            {new Date(leave.startDate).toLocaleDateString()} -{' '}
            {new Date(leave.endDate).toLocaleDateString()}
          </p>
          <p>Trạng thái: {leave.status}</p>
        </div>
      ))}
    </div>
  );
}
*/

