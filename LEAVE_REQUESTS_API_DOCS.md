# 📋 Leave Requests API Documentation

Tài liệu API cho module quản lý đơn xin nghỉ (Leave Requests).

## 📌 Tổng quan

Module này cung cấp các API để quản lý đơn xin nghỉ của nhân viên, bao gồm:

- Tạo, xem, cập nhật, hủy đơn xin nghỉ (Employee)
- Duyệt, từ chối đơn xin nghỉ (Admin/Manager)
- Xóa đơn xin nghỉ (Admin)

**Base URL**: `http://localhost:3000` (hoặc URL của server production)

**Base Path**: `/leave-requests`

**Authentication**: Tất cả endpoints đều yêu cầu JWT Bearer Token trong header:

```
Authorization: Bearer <your-jwt-token>
```

---

## 📊 Enums & Types

### LeaveRequestStatus

```typescript
enum LeaveRequestStatus {
  PENDING = 'PENDING', // Đang chờ xử lý
  APPROVED = 'APPROVED', // Đã duyệt
  REJECTED = 'REJECTED', // Đã từ chối
  CANCELLED = 'CANCELLED', // Đã hủy
}
```

### LeaveRequest Entity

```typescript
interface LeaveRequest {
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
  employee?: {
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
  };
}
```

---

## 🔐 Phân quyền

- **Employee**: Có thể tạo, xem, cập nhật, hủy đơn xin nghỉ của chính mình
- **Admin/Manager**: Có thể xem tất cả đơn, duyệt, từ chối, xóa đơn

---

## 📡 Endpoints

### 1. Tạo đơn xin nghỉ

**POST** `/leave-requests`

**Quyền**: Employee only

**Request Body**:

```json
{
  "startDate": "2024-01-15T00:00:00.000Z",
  "endDate": "2024-01-17T00:00:00.000Z",
  "reason": "Nghỉ phép cá nhân" // Optional
}
```

**Request Schema**:

```typescript
{
  startDate: string;    // Required, ISO 8601 date string
  endDate: string;      // Required, ISO 8601 date string
  reason?: string;      // Optional
}
```

**Response** (201 Created):

```json
{
  "id": "clx1234567890",
  "employeeId": "clx0987654321",
  "startDate": "2024-01-15T00:00:00.000Z",
  "endDate": "2024-01-17T00:00:00.000Z",
  "reason": "Nghỉ phép cá nhân",
  "status": "PENDING",
  "approvedBy": null,
  "approvedAt": null,
  "rejectedBy": null,
  "rejectedAt": null,
  "rejectedReason": null,
  "createdAt": "2024-01-10T10:30:00.000Z",
  "updatedAt": "2024-01-10T10:30:00.000Z",
  "employee": {
    "id": "clx0987654321",
    "name": "Nguyễn Văn A",
    "user": {
      "name": "Nguyễn Văn A"
    }
  }
}
```

**Error Responses**:

- `400 Bad Request`:
  - "Ngày bắt đầu không thể sau ngày kết thúc"
  - "Không thể tạo đơn xin nghỉ cho ngày trong quá khứ"
  - "Bạn đã có đơn xin nghỉ trong khoảng thời gian này"
  - "Bạn phải là nhân viên để tạo đơn xin nghỉ"

---

### 2. Lấy danh sách đơn xin nghỉ của tôi

**GET** `/leave-requests`

**Quyền**: Employee only

**Query Parameters**:

```
?page=1&limit=10
```

**Query Schema**:

```typescript
{
  page?: number;    // Default: 1, minimum: 1
  limit?: number;   // Default: 10, minimum: 1, maximum: 1000
}
```

**Response** (200 OK):

```json
{
  "data": [
    {
      "id": "clx1234567890",
      "employeeId": "clx0987654321",
      "startDate": "2024-01-15T00:00:00.000Z",
      "endDate": "2024-01-17T00:00:00.000Z",
      "reason": "Nghỉ phép cá nhân",
      "status": "PENDING",
      "approvedBy": null,
      "approvedAt": null,
      "rejectedBy": null,
      "rejectedAt": null,
      "rejectedReason": null,
      "createdAt": "2024-01-10T10:30:00.000Z",
      "updatedAt": "2024-01-10T10:30:00.000Z",
      "employee": {
        "id": "clx0987654321",
        "name": "Nguyễn Văn A",
        "user": {
          "name": "Nguyễn Văn A"
        }
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

**Error Responses**:

- `400 Bad Request`: "Bạn phải là nhân viên để xem đơn xin nghỉ"

---

### 3. Lấy tất cả đơn xin nghỉ (với filter)

**GET** `/leave-requests/all`

**Quyền**: Admin/Manager only

**Query Parameters**:

```
?page=1&limit=10&employeeId=clx0987654321&status=PENDING&startDateFrom=2024-01-01T00:00:00.000Z&endDateTo=2024-12-31T23:59:59.999Z
```

**Query Schema**:

```typescript
{
  page?: number;              // Default: 1
  limit?: number;             // Default: 10
  employeeId?: string;        // Optional: Filter by employee ID
  status?: LeaveRequestStatus; // Optional: Filter by status
  startDateFrom?: string;     // Optional: Filter from date (ISO 8601)
  endDateTo?: string;         // Optional: Filter to date (ISO 8601)
}
```

**Response** (200 OK):

```json
{
  "data": [
    {
      "id": "clx1234567890",
      "employeeId": "clx0987654321",
      "startDate": "2024-01-15T00:00:00.000Z",
      "endDate": "2024-01-17T00:00:00.000Z",
      "reason": "Nghỉ phép cá nhân",
      "status": "PENDING",
      "approvedBy": null,
      "approvedAt": null,
      "rejectedBy": null,
      "rejectedAt": null,
      "rejectedReason": null,
      "createdAt": "2024-01-10T10:30:00.000Z",
      "updatedAt": "2024-01-10T10:30:00.000Z",
      "employee": {
        "id": "clx0987654321",
        "name": "Nguyễn Văn A",
        "user": {
          "name": "Nguyễn Văn A"
        },
        "department": {
          "id": "clx1111111111",
          "name": "Phòng Kỹ thuật"
        },
        "branch": {
          "id": "clx2222222222",
          "name": "Chi nhánh Hà Nội"
        }
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

---

### 4. Lấy chi tiết đơn xin nghỉ

**GET** `/leave-requests/:id`

**Quyền**: All authenticated users

**Path Parameters**:

- `id` (string, required): ID của đơn xin nghỉ

**Response** (200 OK):

```json
{
  "id": "clx1234567890",
  "employeeId": "clx0987654321",
  "startDate": "2024-01-15T00:00:00.000Z",
  "endDate": "2024-01-17T00:00:00.000Z",
  "reason": "Nghỉ phép cá nhân",
  "status": "PENDING",
  "approvedBy": null,
  "approvedAt": null,
  "rejectedBy": null,
  "rejectedAt": null,
  "rejectedReason": null,
  "createdAt": "2024-01-10T10:30:00.000Z",
  "updatedAt": "2024-01-10T10:30:00.000Z",
  "employee": {
    "id": "clx0987654321",
    "name": "Nguyễn Văn A",
    "user": {
      "name": "Nguyễn Văn A"
    },
    "department": {
      "id": "clx1111111111",
      "name": "Phòng Kỹ thuật"
    },
    "branch": {
      "id": "clx2222222222",
      "name": "Chi nhánh Hà Nội"
    }
  }
}
```

**Error Responses**:

- `404 Not Found`: "Leave request with ID {id} not found"

---

### 5. Duyệt đơn xin nghỉ

**PATCH** `/leave-requests/:id/approve`

**Quyền**: Admin/Manager only

**Path Parameters**:

- `id` (string, required): ID của đơn xin nghỉ

**Request Body**: Không cần body

**Response** (200 OK):

```json
{
  "id": "clx1234567890",
  "employeeId": "clx0987654321",
  "startDate": "2024-01-15T00:00:00.000Z",
  "endDate": "2024-01-17T00:00:00.000Z",
  "reason": "Nghỉ phép cá nhân",
  "status": "APPROVED",
  "approvedBy": "clx3333333333",
  "approvedAt": "2024-01-11T09:00:00.000Z",
  "rejectedBy": null,
  "rejectedAt": null,
  "rejectedReason": null,
  "createdAt": "2024-01-10T10:30:00.000Z",
  "updatedAt": "2024-01-11T09:00:00.000Z",
  "employee": {
    "id": "clx0987654321",
    "name": "Nguyễn Văn A",
    "user": {
      "name": "Nguyễn Văn A"
    }
  }
}
```

**Error Responses**:

- `400 Bad Request`:
  - "Bạn không có quyền duyệt đơn xin nghỉ"
  - "Chỉ có thể duyệt đơn xin nghỉ đang chờ xử lý"
- `404 Not Found`: "Leave request with ID {id} not found"

---

### 6. Từ chối đơn xin nghỉ

**PATCH** `/leave-requests/:id/reject`

**Quyền**: Admin/Manager only

**Path Parameters**:

- `id` (string, required): ID của đơn xin nghỉ

**Request Body**:

```json
{
  "rejectedReason": "Không đủ số ngày nghỉ phép"
}
```

**Request Schema**:

```typescript
{
  rejectedReason: string; // Required
}
```

**Response** (200 OK):

```json
{
  "id": "clx1234567890",
  "employeeId": "clx0987654321",
  "startDate": "2024-01-15T00:00:00.000Z",
  "endDate": "2024-01-17T00:00:00.000Z",
  "reason": "Nghỉ phép cá nhân",
  "status": "REJECTED",
  "approvedBy": null,
  "approvedAt": null,
  "rejectedBy": "clx3333333333",
  "rejectedAt": "2024-01-11T09:00:00.000Z",
  "rejectedReason": "Không đủ số ngày nghỉ phép",
  "createdAt": "2024-01-10T10:30:00.000Z",
  "updatedAt": "2024-01-11T09:00:00.000Z",
  "employee": {
    "id": "clx0987654321",
    "name": "Nguyễn Văn A",
    "user": {
      "name": "Nguyễn Văn A"
    }
  }
}
```

**Error Responses**:

- `400 Bad Request`:
  - "Bạn không có quyền từ chối đơn xin nghỉ"
  - "Lý do từ chối là bắt buộc"
  - "Chỉ có thể từ chối đơn xin nghỉ đang chờ xử lý"
- `404 Not Found`: "Leave request with ID {id} not found"

---

### 7. Hủy đơn xin nghỉ

**PATCH** `/leave-requests/:id/cancel`

**Quyền**: Employee only (chỉ hủy đơn của chính mình)

**Path Parameters**:

- `id` (string, required): ID của đơn xin nghỉ

**Request Body**:

```json
{
  "cancelReason": "Thay đổi kế hoạch"
}
```

**Request Schema**:

```typescript
{
  cancelReason: string; // Required
}
```

**Response** (200 OK):

```json
{
  "id": "clx1234567890",
  "employeeId": "clx0987654321",
  "startDate": "2024-01-15T00:00:00.000Z",
  "endDate": "2024-01-17T00:00:00.000Z",
  "reason": "Nghỉ phép cá nhân",
  "status": "CANCELLED",
  "approvedBy": null,
  "approvedAt": null,
  "rejectedBy": null,
  "rejectedAt": null,
  "rejectedReason": null,
  "createdAt": "2024-01-10T10:30:00.000Z",
  "updatedAt": "2024-01-11T10:00:00.000Z",
  "employee": {
    "id": "clx0987654321",
    "name": "Nguyễn Văn A",
    "user": {
      "name": "Nguyễn Văn A"
    }
  }
}
```

**Error Responses**:

- `400 Bad Request`:
  - "Bạn phải là nhân viên để hủy đơn xin nghỉ"
  - "Lý do hủy là bắt buộc"
  - "Chỉ có thể hủy đơn xin nghỉ đang chờ xử lý"
  - "Không thể hủy đơn xin nghỉ đã bắt đầu"
- `404 Not Found`: "Leave request with ID {id} not found"

---

### 8. Cập nhật đơn xin nghỉ

**PATCH** `/leave-requests/:id`

**Quyền**: Employee only (chỉ cập nhật đơn của chính mình)

**Path Parameters**:

- `id` (string, required): ID của đơn xin nghỉ

**Request Body**:

```json
{
  "startDate": "2024-01-16T00:00:00.000Z",
  "endDate": "2024-01-18T00:00:00.000Z",
  "reason": "Nghỉ phép cá nhân - đã cập nhật"
}
```

**Request Schema**:

```typescript
{
  startDate: string;    // Required, ISO 8601 date string
  endDate: string;      // Required, ISO 8601 date string
  reason?: string;      // Optional
}
```

**Response** (200 OK):

```json
{
  "id": "clx1234567890",
  "employeeId": "clx0987654321",
  "startDate": "2024-01-16T00:00:00.000Z",
  "endDate": "2024-01-18T00:00:00.000Z",
  "reason": "Nghỉ phép cá nhân - đã cập nhật",
  "status": "PENDING",
  "approvedBy": null,
  "approvedAt": null,
  "rejectedBy": null,
  "rejectedAt": null,
  "rejectedReason": null,
  "createdAt": "2024-01-10T10:30:00.000Z",
  "updatedAt": "2024-01-11T11:00:00.000Z",
  "employee": {
    "id": "clx0987654321",
    "name": "Nguyễn Văn A",
    "user": {
      "name": "Nguyễn Văn A"
    }
  }
}
```

**Error Responses**:

- `400 Bad Request`:
  - "Bạn phải là nhân viên để cập nhật đơn xin nghỉ"
  - "Ngày bắt đầu không thể sau ngày kết thúc"
  - "Không thể chỉnh sửa đơn xin nghỉ cho ngày trong quá khứ"
  - "Bạn đã có đơn xin nghỉ trong khoảng thời gian này"
  - "Chỉ có thể chỉnh sửa đơn xin nghỉ đang chờ xử lý"
- `404 Not Found`: "Leave request with ID {id} not found"

---

### 9. Xóa đơn xin nghỉ

**DELETE** `/leave-requests/:id`

**Quyền**: Admin only

**Path Parameters**:

- `id` (string, required): ID của đơn xin nghỉ

**Response** (200 OK):

```json
{
  "id": "clx1234567890",
  "employeeId": "clx0987654321",
  "startDate": "2024-01-15T00:00:00.000Z",
  "endDate": "2024-01-17T00:00:00.000Z",
  "reason": "Nghỉ phép cá nhân",
  "status": "PENDING",
  "approvedBy": null,
  "approvedAt": null,
  "rejectedBy": null,
  "rejectedAt": null,
  "rejectedReason": null,
  "createdAt": "2024-01-10T10:30:00.000Z",
  "updatedAt": "2024-01-10T10:30:00.000Z"
}
```

**Error Responses**:

- `400 Bad Request`:
  - "Bạn không có quyền xóa đơn xin nghỉ"
  - "Chỉ có thể xóa đơn xin nghỉ đang chờ xử lý hoặc đã hủy"
- `404 Not Found`: "Leave request with ID {id} not found"

---

## 🔍 Validation Rules

### Date Validation

- `startDate` phải <= `endDate`
- `startDate` không được là ngày trong quá khứ (khi tạo/cập nhật)
- Không được có đơn xin nghỉ trùng thời gian (PENDING hoặc APPROVED)

### Status Rules

- Chỉ có thể cập nhật/hủy đơn có status = `PENDING`
- Chỉ có thể duyệt/từ chối đơn có status = `PENDING`
- Chỉ có thể xóa đơn có status = `PENDING` hoặc `CANCELLED`
- Không thể hủy đơn đã bắt đầu (startDate < today)

### Required Fields

- `startDate`: Required
- `endDate`: Required
- `rejectedReason`: Required khi reject
- `cancelReason`: Required khi cancel

---

## 📝 Example Usage

### JavaScript/TypeScript (Fetch API)

```typescript
// 1. Tạo đơn xin nghỉ
const createLeaveRequest = async (data: {
  startDate: string;
  endDate: string;
  reason?: string;
}) => {
  const response = await fetch('http://localhost:3000/leave-requests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return response.json();
};

// 2. Lấy danh sách đơn của tôi
const getMyLeaveRequests = async (page = 1, limit = 10) => {
  const response = await fetch(
    `http://localhost:3000/leave-requests?page=${page}&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return response.json();
};

// 3. Duyệt đơn
const approveLeaveRequest = async (id: string) => {
  const response = await fetch(
    `http://localhost:3000/leave-requests/${id}/approve`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return response.json();
};

// 4. Từ chối đơn
const rejectLeaveRequest = async (id: string, rejectedReason: string) => {
  const response = await fetch(
    `http://localhost:3000/leave-requests/${id}/reject`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ rejectedReason }),
    },
  );
  return response.json();
};

// 5. Hủy đơn
const cancelLeaveRequest = async (id: string, cancelReason: string) => {
  const response = await fetch(
    `http://localhost:3000/leave-requests/${id}/cancel`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ cancelReason }),
    },
  );
  return response.json();
};
```

### Axios Example

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Tạo đơn xin nghỉ
const createLeaveRequest = (data: {
  startDate: string;
  endDate: string;
  reason?: string;
}) => {
  return api.post('/leave-requests', data);
};

// Lấy danh sách đơn của tôi
const getMyLeaveRequests = (page = 1, limit = 10) => {
  return api.get('/leave-requests', {
    params: { page, limit },
  });
};

// Duyệt đơn
const approveLeaveRequest = (id: string) => {
  return api.patch(`/leave-requests/${id}/approve`);
};

// Từ chối đơn
const rejectLeaveRequest = (id: string, rejectedReason: string) => {
  return api.patch(`/leave-requests/${id}/reject`, { rejectedReason });
};

// Hủy đơn
const cancelLeaveRequest = (id: string, cancelReason: string) => {
  return api.patch(`/leave-requests/${id}/cancel`, { cancelReason });
};
```

---

## ⚠️ Error Handling

Tất cả lỗi đều trả về format chuẩn:

```json
{
  "statusCode": 400,
  "message": "Error message here",
  "error": "Bad Request"
}
```

### Common Error Codes

- `400 Bad Request`: Validation error, business logic error
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Không có quyền truy cập
- `404 Not Found`: Resource không tồn tại
- `500 Internal Server Error`: Server error

---

## 📌 Notes

1. **Date Format**: Tất cả dates đều sử dụng ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`
2. **Pagination**: Mặc định `page=1`, `limit=10`. Maximum `limit=1000`
3. **Ordering**: Danh sách được sắp xếp theo `createdAt DESC` (mới nhất trước)
4. **Overlap Check**: Hệ thống tự động kiểm tra trùng lặp với các đơn PENDING hoặc APPROVED
5. **Status Flow**:
   - `PENDING` → `APPROVED` (duyệt)
   - `PENDING` → `REJECTED` (từ chối)
   - `PENDING` → `CANCELLED` (hủy)
6. **Time Zone**: Tất cả dates được lưu và trả về theo UTC

---

## 🔗 Related Endpoints

- **Employee Management**: `/employees`
- **Shift Signups**: `/shift-signups` (có thể liên quan khi check overlap với ca làm việc)

---

**Last Updated**: 2024-01-10
**API Version**: 1.0.0
