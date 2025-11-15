/**
 * TypeScript Types & Interfaces cho Leave Requests API
 * Copy file này vào project Frontend để sử dụng
 */

// ============================================
// Enums
// ============================================

export enum LeaveRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

// ============================================
// Request DTOs
// ============================================

export interface CreateLeaveRequestDto {
  startDate: string; // ISO 8601 date string
  endDate: string; // ISO 8601 date string
  reason?: string; // Optional
}

export interface RejectLeaveRequestDto {
  rejectedReason: string; // Required
}

export interface CancelLeaveRequestDto {
  cancelReason: string; // Required
}

export interface QueryLeaveRequestDto {
  page?: number; // Default: 1
  limit?: number; // Default: 10
  employeeId?: string; // Optional: Filter by employee ID
  status?: LeaveRequestStatus; // Optional: Filter by status
  startDateFrom?: string; // Optional: Filter from date (ISO 8601)
  endDateTo?: string; // Optional: Filter to date (ISO 8601)
}

// ============================================
// Response Types
// ============================================

export interface EmployeeInfo {
  id: string;
  name: string;
  user?: {
    name: string;
  };
  department?: {
    id: string;
    name: string;
  };
  branch?: {
    id: string;
    name: string;
  };
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  startDate: string; // ISO 8601 date string
  endDate: string; // ISO 8601 date string
  reason?: string;
  status: LeaveRequestStatus;
  approvedBy?: string;
  approvedAt?: string; // ISO 8601 date string
  rejectedBy?: string;
  rejectedAt?: string; // ISO 8601 date string
  rejectedReason?: string;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
  employee?: EmployeeInfo;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type LeaveRequestListResponse = PaginatedResponse<LeaveRequest>;

// ============================================
// API Response Types
// ============================================

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
}

// ============================================
// Helper Types
// ============================================

export type LeaveRequestWithEmployee = LeaveRequest & {
  employee: EmployeeInfo;
};

export type LeaveRequestCreateResponse = LeaveRequestWithEmployee;
export type LeaveRequestUpdateResponse = LeaveRequestWithEmployee;
export type LeaveRequestDetailResponse = LeaveRequestWithEmployee;
export type LeaveRequestApproveResponse = LeaveRequestWithEmployee;
export type LeaveRequestRejectResponse = LeaveRequestWithEmployee;
export type LeaveRequestCancelResponse = LeaveRequestWithEmployee;
