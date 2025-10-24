# 📋 Task Management Workflow

## 🎯 Flow Chính: Nhân Viên → Manager

### Bước 1: Nhân Viên Cập Nhật Tiến Độ

**Endpoint:** `POST /task-instances/:id/update-progress`

**Request:**

```json
{
  "delta": 10,
  "note": "Hoàn thành 10 đơn hàng hôm nay"
}
```

**Response:**

```json
{
  "id": "instance123",
  "quantity": 40,  // Tự động cộng thêm 10
  "status": "IN_PROGRESS",  // Tự động chuyển từ PENDING → IN_PROGRESS
  ...
}
```

### Bước 2: Nhân Viên Tự Đánh Dấu Hoàn Thành

**Endpoint:** `POST /task-instances/:id/complete`

**Request:**

```json
{
  "note": "Đã hoàn thành đủ target" // Optional
}
```

**Response:**

```json
{
  "id": "instance123",
  "status": "COMPLETED",  // Chuyển sang COMPLETED - chờ duyệt
  "completedAt": "2025-10-24T10:00:00.000Z",
  "completedBy": "userId_from_token",  // Tự động lấy từ token
  ...
}
```

**Lưu ý:**

- System tự động lấy `completedBy` từ JWT token
- Nhân viên KHÔNG CẦN truyền `completedBy` trong request
- Status tự động chuyển: IN_PROGRESS → COMPLETED
- Task đã COMPLETED sẽ nằm trong hàng chờ phê duyệt

### Bước 3a: Manager Phê Duyệt

**Endpoint:** `POST /task-instances/:id/approve`

**Request:**

```json
{
  "approvedBy": "managerId", // ID của manager
  "reason": "Làm tốt lắm!" // Optional
}
```

**Response:**

```json
{
  "id": "instance123",
  "status": "APPROVED",  // ✅ Đã được duyệt
  "approvedAt": "2025-10-24T14:00:00.000Z",
  "approvedBy": "managerId",
  ...
}
```

### Bước 3b: Manager Từ Chối

**Endpoint:** `POST /task-instances/:id/reject`

**Request:**

```json
{
  "rejectedBy": "managerId",
  "rejectedReason": "Cần bổ sung thêm báo cáo" // Required
}
```

**Response:**

```json
{
  "id": "instance123",
  "status": "REJECTED",  // ❌ Bị từ chối
  "rejectedAt": "2025-10-24T14:00:00.000Z",
  "rejectedBy": "managerId",
  "rejectedReason": "Cần bổ sung thêm báo cáo",
  ...
}
```

**Sau khi bị reject:**

- Nhân viên có thể tiếp tục cập nhật progress
- Nhân viên complete lại → quay lại COMPLETED
- Manager review và approve/reject lại

---

## 📊 Status Flow Chart

```
┌─────────┐
│ PENDING │ ← Task mới tạo
└────┬────┘
     │ Nhân viên update progress
     ▼
┌──────────────┐
│ IN_PROGRESS  │ ← Đang thực hiện
└──────┬───────┘
       │ Nhân viên complete
       ▼
┌───────────┐
│ COMPLETED │ ← Chờ phê duyệt
└─────┬─────┘
      │
      ├──────────────┬───────────────┐
      │ Manager      │ Manager       │
      │ approve      │ reject        │
      ▼              ▼               │
┌──────────┐   ┌──────────┐         │
│ APPROVED │   │ REJECTED │         │
└──────────┘   └────┬─────┘         │
      ✅            │               │
                    │ Nhân viên     │
                    │ fix & complete│
                    └───────────────┘
                    (quay lại COMPLETED)
```

---

## 💡 Use Cases Thực Tế

### Use Case 1: Nhân Viên Bán Hàng

```javascript
// 1. Nhân viên lấy task của mình
const myTasks = await GET('/task-instances?employeeId=emp123&status=PENDING');
// Response: [{ id: 'task1', title: 'Doanh số tháng 11', target: 50, quantity: 0 }]

// 2. Mỗi ngày cập nhật tiến độ
await POST('/task-instances/task1/update-progress', {
  delta: 5,
  note: 'Bán được 5 đơn hôm nay',
});
// quantity: 0 → 5

await POST('/task-instances/task1/update-progress', {
  delta: 10,
  note: 'Bán được 10 đơn hôm nay',
});
// quantity: 5 → 15

// ... tiếp tục cho đến khi đạt target

await POST('/task-instances/task1/update-progress', {
  delta: 8,
});
// quantity: 42 → 50 (đạt target)

// 3. Nhân viên TỰ đánh dấu hoàn thành
await POST('/task-instances/task1/complete', {
  note: 'Đã hoàn thành đủ 50 đơn hàng',
});
// Status: IN_PROGRESS → COMPLETED

// 4. Manager xem danh sách chờ duyệt
const pendingApprovals = await GET('/task-instances?status=COMPLETED');

// 5. Manager phê duyệt
await POST('/task-instances/task1/approve', {
  approvedBy: 'manager123',
  reason: 'Excellent work!',
});
// Status: COMPLETED → APPROVED ✅
```

### Use Case 2: Task Bị Reject

```javascript
// 1. Manager reject task
await POST('/task-instances/task1/reject', {
  rejectedBy: 'manager123',
  rejectedReason: 'Thiếu báo cáo chi tiết',
});
// Status: COMPLETED → REJECTED

// 2. Nhân viên xem lý do reject
const task = await GET('/task-instances/task1');
console.log(task.rejectedReason); // "Thiếu báo cáo chi tiết"

// 3. Nhân viên bổ sung và complete lại
await POST('/task-instances/task1/update-progress', {
  delta: 0,
  note: 'Đã bổ sung báo cáo chi tiết',
});

await POST('/task-instances/task1/complete', {
  note: 'Đã hoàn thành và bổ sung báo cáo',
});
// Status: REJECTED → COMPLETED (chờ duyệt lại)

// 4. Manager duyệt lần 2
await POST('/task-instances/task1/approve', {
  approvedBy: 'manager123',
});
// Status: COMPLETED → APPROVED ✅
```

---

## 🎨 UI/UX Suggestions

### Dashboard Nhân Viên

**My Tasks:**

```
┌─────────────────────────────────────────────────┐
│ Pending (5)                                     │
│ ┌─────────────────────────────────────────────┐ │
│ │ Doanh số tháng 11                           │ │
│ │ Progress: 35/50 (70%)                       │ │
│ │ [────────────────────────▒▒▒▒▒▒▒▒]         │ │
│ │ [Update Progress] [Complete]                │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Rejected (1) - Cần xử lý                        │
│ ┌─────────────────────────────────────────────┐ │
│ │ KPI chăm sóc khách hàng                     │ │
│ │ ❌ Manager: "Thiếu báo cáo feedback"        │ │
│ │ [View Details] [Fix & Resubmit]             │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Waiting Approval (2)                            │
│ ⏳ Đang chờ manager phê duyệt                   │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Approved (15) ✅                                 │
│ Completion Rate: 88%                            │
└─────────────────────────────────────────────────┘
```

### Dashboard Manager

**Approval Queue:**

```
┌─────────────────────────────────────────────────┐
│ Pending Approval (8)                            │
│ ┌─────────────────────────────────────────────┐ │
│ │ Nguyễn Văn A - Doanh số tháng 11            │ │
│ │ Target: 50 | Achieved: 52 (104%)            │ │
│ │ Completed: 2 hours ago                      │ │
│ │ [View Details] [✅ Approve] [❌ Reject]     │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ Trần Thị B - KPI chăm sóc KH                │ │
│ │ Target: 100 | Achieved: 100 (100%)          │ │
│ │ Completed: 5 hours ago                      │ │
│ │ [View Details] [✅ Approve] [❌ Reject]     │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Task Detail Modal

```
┌────────────────────────────────────────────────────┐
│ Task Details                                  [×]  │
├────────────────────────────────────────────────────┤
│ Doanh số tháng 11                                  │
│ Status: ⏳ COMPLETED (Waiting Approval)            │
│ Employee: Nguyễn Văn A                             │
│ Progress: 52/50 (104%) ✅                          │
│                                                    │
│ Progress History:                                  │
│ ┌────────────────────────────────────────────┐   │
│ │ Oct 24, 10:00 - Completed (+0)            │   │
│ │ "Đã hoàn thành đủ target"                 │   │
│ │                                            │   │
│ │ Oct 23, 15:00 - Progress (+8)             │   │
│ │ "Bán được 8 đơn hôm nay"                  │   │
│ │                                            │   │
│ │ Oct 22, 14:30 - Progress (+10)            │   │
│ │ "Bán được 10 đơn hôm nay"                 │   │
│ └────────────────────────────────────────────┘   │
│                                                    │
│ Manager Actions:                                   │
│ ┌────────────────────────────────────────────┐   │
│ │ Reason (optional):                         │   │
│ │ ┌────────────────────────────────────────┐ │   │
│ │ │ Well done! Exceeded target.            │ │   │
│ │ └────────────────────────────────────────┘ │   │
│ │                                            │   │
│ │ [✅ Approve]  [❌ Reject]                  │   │
│ └────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────┘
```

---

## 🔔 Notifications Suggestions

### Nhân Viên

1. **Task mới được gán:**
   - "Bạn có 1 task mới: Doanh số tháng 11"

2. **Task bị reject:**
   - "Task 'KPI chăm sóc KH' đã bị từ chối"
   - "Lý do: Thiếu báo cáo chi tiết"

3. **Task được approve:**
   - "Task 'Doanh số tháng 11' đã được phê duyệt ✅"

4. **Task sắp hết hạn:**
   - "Task 'Doanh số tháng 11' sẽ hết hạn trong 2 ngày"

### Manager

1. **Task chờ duyệt:**
   - "Có 3 tasks đang chờ phê duyệt"

2. **Task bị quá hạn:**
   - "5 tasks đã quá hạn - cần xử lý"

---

## 🚀 API Endpoints Summary

| Endpoint                                      | Method | Người Dùng | Mục Đích            |
| --------------------------------------------- | ------ | ---------- | ------------------- |
| `/task-instances/:id/update-progress`         | POST   | Nhân viên  | Cập nhật tiến độ    |
| `/task-instances/:id/complete`                | POST   | Nhân viên  | Đánh dấu hoàn thành |
| `/task-instances/:id/approve`                 | POST   | Manager    | Phê duyệt task      |
| `/task-instances/:id/reject`                  | POST   | Manager    | Từ chối task        |
| `/task-instances?employeeId=X&status=PENDING` | GET    | Nhân viên  | Xem tasks của mình  |
| `/task-instances?status=COMPLETED`            | GET    | Manager    | Xem tasks chờ duyệt |
| `/task-instances/:id`                         | GET    | Cả 2       | Xem chi tiết task   |

---

## ✅ Validation Rules

### Complete Task

- ✅ Status phải là: PENDING, IN_PROGRESS, hoặc REJECTED
- ✅ Quantity phải >= Target (nếu có target)
- ❌ Không thể complete task đã COMPLETED/APPROVED/EXPIRED

### Approve Task

- ✅ Status phải là: COMPLETED
- ❌ Không thể approve task chưa COMPLETED

### Reject Task

- ✅ Status phải là: COMPLETED
- ✅ Phải có `rejectedReason`
- ❌ Không thể reject task chưa COMPLETED

---

## 🎯 Best Practices

1. **Nhân viên:**
   - Update progress thường xuyên
   - Complete ngay khi đạt target
   - Check rejected tasks để xử lý kịp thời

2. **Manager:**
   - Review tasks chờ duyệt hàng ngày
   - Provide clear feedback khi reject
   - Track team completion rate

3. **System:**
   - Auto-notify khi có tasks chờ duyệt
   - Mark expired tasks tự động
   - Generate reports định kỳ

---

Happy Task Managing! 🎉
