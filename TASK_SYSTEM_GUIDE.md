# 📋 Task Management System - Complete Guide

## 🎯 Overview

Hướng dẫn đầy đủ về hệ thống quản lý task từ A-Z, bao gồm:

- **Architecture & Flow**: Hiểu rõ cách hệ thống hoạt động
- **API Documentation**: Tất cả endpoints với examples
- **UI/UX Design**: Gợi ý thiết kế giao diện
- **Best Practices**: Tips & tricks

---

## 📐 System Architecture

### Database Schema

```
┌──────────────────┐
│     TaskV2       │  ← Task Template (Thông tin chung)
│                  │     - title, description
│ id               │     - department, level
│ title            │     - isTaskTeam (DEPARTMENT/INDIVIDUAL)
│ description      │
│ departmentId     │
│ isTaskTeam       │
└────────┬─────────┘
         │ 1:N
         ▼
┌──────────────────┐
│   TaskCycleV2    │  ← Chu kỳ thực hiện (Period)
│                  │     - periodStart, periodEnd
│ id               │
│ taskId           │
│ periodStart      │
│ periodEnd        │
└────────┬─────────┘
         │ 1:N
         ▼
┌──────────────────┐
│ TaskAssignment   │  ← Gán nhân viên (N-N Junction)
│                  │     - status, approval
│ id               │     - completedAt, approvedAt
│ cycleId          │
│ employeeId       │
│ status           │
│ completedBy      │
│ approvedBy       │
└────────┬─────────┘
         │ N:1
         ▼
┌──────────────────┐
│    Employee      │
└──────────────────┘
```

### Status Flow

```
┌─────────┐
│ PENDING │ ← Assignment mới được gán
└────┬────┘
     │ (tự động khi được gán)
     ▼
┌──────────────┐
│ IN_PROGRESS  │ ← Nhân viên đang làm
└──────┬───────┘
       │ POST /task-assignments/:id/complete
       ▼
┌───────────┐
│ COMPLETED │ ← Chờ manager duyệt
└─────┬─────┘
      │
      ├──────────────┬───────────────┐
      │              │               │
      │ approve      │ reject        │
      ▼              ▼               │
┌──────────┐   ┌──────────┐         │
│ APPROVED │   │ REJECTED │         │
└──────────┘   └────┬─────┘         │
      ✅            │               │
                    │ fix           │
                    └───────────────┘
                    (quay về IN_PROGRESS)
```

---

## 🔄 Complete Workflow

### Phase 1: Manager Tạo Task & Gán Nhân Viên

#### Step 1.1: Tạo Task Template

```http
POST /tasks
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "title": "Hoàn thành KPI bán hàng tháng 11",
  "description": "Mỗi nhân viên cần chăm sóc ít nhất 100 khách hàng và đạt doanh số 50 triệu",
  "departmentId": "dept_sales_001",
  "level": 1,
  "required": true,
  "isActive": true,
  "isTaskTeam": false
}
```

**Response:**

```json
{
  "id": "task_abc123",
  "title": "Hoàn thành KPI bán hàng tháng 11",
  "description": "...",
  "departmentId": "dept_sales_001",
  "department": {
    "id": "dept_sales_001",
    "name": "Phòng Kinh Doanh"
  },
  "level": 1,
  "isTaskTeam": false,
  "isActive": true,
  "createdAt": "2025-10-27T10:00:00Z"
}
```

#### Step 1.2: Tạo Task Cycle (Chu kỳ)

```http
POST /task-cycles
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "taskId": "task_abc123",
  "periodStart": "2025-11-01T00:00:00Z",
  "periodEnd": "2025-11-30T23:59:59Z"
}
```

**Response:**

```json
{
  "id": "cycle_xyz789",
  "taskId": "task_abc123",
  "task": {
    "id": "task_abc123",
    "title": "Hoàn thành KPI bán hàng tháng 11"
  },
  "periodStart": "2025-11-01T00:00:00Z",
  "periodEnd": "2025-11-30T23:59:59Z",
  "createdAt": "2025-10-27T10:01:00Z"
}
```

#### Step 1.3: Gán Nhân Viên vào Cycle

**Option A: Gán theo danh sách cụ thể**

```http
POST /task-assignments/assign-to-cycle
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "cycleId": "cycle_xyz789",
  "employeeIds": ["emp_001", "emp_002", "emp_003"]
}
```

**Option B: Gán toàn bộ phòng ban (RECOMMENDED ⭐)**

```http
POST /task-assignments/assign-to-cycle
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "cycleId": "cycle_xyz789",
  "departmentId": "dept_sales_001"
}
```

**Response:**

```json
{
  "cycleId": "cycle_xyz789",
  "task": {
    "id": "task_abc123",
    "title": "Hoàn thành KPI bán hàng tháng 11"
  },
  "period": {
    "start": "2025-11-01T00:00:00Z",
    "end": "2025-11-30T23:59:59Z"
  },
  "assignedCount": 10,
  "skippedCount": 0,
  "assignments": [
    {
      "id": "assign_001",
      "cycleId": "cycle_xyz789",
      "employeeId": "emp_001",
      "status": "PENDING",
      "employee": {
        "id": "emp_001",
        "name": "Nguyễn Văn A",
        "departmentId": "dept_sales_001"
      }
    }
    // ... 9 more assignments
  ]
}
```

**✅ Hoàn thành Phase 1!**

- Đã tạo 1 Task template
- Đã tạo 1 Cycle cho tháng 11
- Đã gán 10 nhân viên vào cycle

---

### Phase 2: Nhân Viên Thực Hiện Task

#### Step 2.1: Nhân Viên Xem Tasks Của Mình

```http
GET /task-assignments/employee/emp_001
Authorization: Bearer <employee_token>
```

**Response:**

```json
[
  {
    "id": "assign_001",
    "status": "PENDING",
    "completedAt": null,
    "cycle": {
      "id": "cycle_xyz789",
      "periodStart": "2025-11-01T00:00:00Z",
      "periodEnd": "2025-11-30T23:59:59Z",
      "task": {
        "id": "task_abc123",
        "title": "Hoàn thành KPI bán hàng tháng 11",
        "description": "Mỗi nhân viên cần chăm sóc ít nhất 100 khách hàng..."
      }
    }
  }
]
```

#### Step 2.2: Nhân Viên Đánh Dấu Hoàn Thành

```http
POST /task-assignments/assign_001/complete
Authorization: Bearer <employee_token>
```

**Response:**

```json
{
  "id": "assign_001",
  "status": "COMPLETED",
  "completedAt": "2025-11-25T16:30:00Z",
  "completedBy": "emp_001",
  "cycle": {
    "task": {
      "title": "Hoàn thành KPI bán hàng tháng 11"
    }
  }
}
```

**✅ Hoàn thành Phase 2!**

- Nhân viên đã xem tasks
- Nhân viên đã complete task
- Status: PENDING → IN_PROGRESS → COMPLETED

---

### Phase 3: Manager Phê Duyệt

#### Step 3.1: Manager Xem Danh Sách Chờ Duyệt

```http
GET /task-assignments/pending-approvals
Authorization: Bearer <manager_token>
```

**Optional: Filter theo phòng ban**

```http
GET /task-assignments/pending-approvals?departmentId=dept_sales_001
```

**Response:**

```json
[
  {
    "id": "assign_001",
    "status": "COMPLETED",
    "completedAt": "2025-11-25T16:30:00Z",
    "completedBy": "emp_001",
    "employee": {
      "id": "emp_001",
      "name": "Nguyễn Văn A",
      "department": {
        "id": "dept_sales_001",
        "name": "Phòng Kinh Doanh"
      }
    },
    "cycle": {
      "periodStart": "2025-11-01T00:00:00Z",
      "periodEnd": "2025-11-30T23:59:59Z",
      "task": {
        "title": "Hoàn thành KPI bán hàng tháng 11"
      }
    }
  },
  {
    "id": "assign_002",
    "status": "COMPLETED",
    "completedAt": "2025-11-26T09:15:00Z",
    "completedBy": "emp_002",
    "employee": {
      "name": "Trần Thị B"
    }
  }
  // ... more pending approvals
]
```

#### Step 3.2a: Manager Approve

```http
POST /task-assignments/assign_001/approve
Authorization: Bearer <manager_token>
```

**Response:**

```json
{
  "id": "assign_001",
  "status": "APPROVED",
  "completedAt": "2025-11-25T16:30:00Z",
  "completedBy": "emp_001",
  "approvedAt": "2025-11-27T10:00:00Z",
  "approvedBy": "manager_123",
  "rejectedAt": null,
  "rejectedBy": null,
  "rejectedReason": null
}
```

#### Step 3.2b: Manager Reject

```http
POST /task-assignments/assign_002/reject
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "rejectedReason": "Chưa đủ bằng chứng hoàn thành, cần bổ sung báo cáo chi tiết"
}
```

**Response:**

```json
{
  "id": "assign_002",
  "status": "REJECTED",
  "completedAt": "2025-11-26T09:15:00Z",
  "completedBy": "emp_002",
  "rejectedAt": "2025-11-27T10:05:00Z",
  "rejectedBy": "manager_123",
  "rejectedReason": "Chưa đủ bằng chứng hoàn thành, cần bổ sung báo cáo chi tiết",
  "approvedAt": null,
  "approvedBy": null
}
```

**✅ Hoàn thành Phase 3!**

- Manager đã review assignments
- Approved hoặc Rejected các tasks
- Status: COMPLETED → APPROVED/REJECTED

---

### Phase 4: Nhân Viên Fix Task Bị Reject (Optional)

```http
# 1. Nhân viên xem lại task bị reject
GET /task-assignments/employee/emp_002?status=REJECTED
Authorization: Bearer <employee_token>

# 2. Sau khi fix, complete lại
POST /task-assignments/assign_002/complete
Authorization: Bearer <employee_token>

# Status: REJECTED → COMPLETED (chờ duyệt lại)
```

---

## 📚 Complete API Reference

### 1. Task Management

#### 1.1 Create Task

```http
POST /tasks
Body: { title, description, departmentId, level, required, isActive, isTaskTeam }
```

#### 1.2 Get All Tasks

```http
GET /tasks?departmentId=xxx&level=1
```

#### 1.3 Get Task Detail

```http
GET /tasks/:id
```

#### 1.4 Update Task

```http
PUT /tasks/:id
Body: { title?, description?, level?, isActive? }
```

#### 1.5 Delete Task

```http
DELETE /tasks/:id
```

---

### 2. Task Cycle Management

#### 2.1 Create Cycle

```http
POST /task-cycles
Body: { taskId, periodStart, periodEnd }
```

#### 2.2 Get All Cycles

```http
GET /task-cycles?taskId=xxx&periodStartFrom=2025-11-01&periodStartTo=2025-11-30
```

#### 2.3 Get Cycle Detail

```http
GET /task-cycles/:id
```

#### 2.4 Update Cycle

```http
PUT /task-cycles/:id
Body: { periodStart?, periodEnd? }
```

#### 2.5 Delete Cycle

```http
DELETE /task-cycles/:id
```

---

### 3. Task Assignment Management

#### 3.1 Create Assignment (Single)

```http
POST /task-assignments
Body: { cycleId, employeeId, status? }
```

#### 3.2 Bulk Assign Employees

```http
POST /task-assignments/assign-to-cycle
Body: { cycleId, employeeIds?: string[], departmentId?: string }
```

#### 3.3 Quick Assign Department

```http
POST /task-assignments/assign-department/:cycleId/:departmentId
```

#### 3.4 Get All Assignments (with filters)

```http
GET /task-assignments?cycleId=xxx&employeeId=xxx&departmentId=xxx&status=PENDING
```

#### 3.5 Get Assignment Detail

```http
GET /task-assignments/:id
```

#### 3.6 Delete Assignment

```http
DELETE /task-assignments/:id
```

#### 3.7 Employee Complete Task

```http
POST /task-assignments/:id/complete
```

#### 3.8 Manager Approve Task

```http
POST /task-assignments/:id/approve
```

#### 3.9 Manager Reject Task

```http
POST /task-assignments/:id/reject
Body: { rejectedReason: string }
```

#### 3.10 Get Pending Approvals

```http
GET /task-assignments/pending-approvals?departmentId=xxx
```

#### 3.11 Get Employee Assignments

```http
GET /task-assignments/employee/:employeeId?status=IN_PROGRESS
```

---

## 🎨 UI/UX Design Suggestions

### 1. Manager Dashboard

#### 1.1 Overview Page

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Task Management Dashboard                    [+ New Task]│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│ │   PENDING   │  │ IN PROGRESS │  │  COMPLETED  │         │
│ │     45      │  │     128     │  │     892     │         │
│ └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ ⏳ Pending Approvals (8)               [View All →]     ││
│ ├─────────────────────────────────────────────────────────┤│
│ │ ✓ Nguyễn Văn A - KPI tháng 11        [Approve][Reject] ││
│ │   Completed 2 hours ago                                 ││
│ │                                                          ││
│ │ ✓ Trần Thị B - KPI tháng 11         [Approve][Reject] ││
│ │   Completed 5 hours ago                                 ││
│ └─────────────────────────────────────────────────────────┘│
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 📋 Active Tasks                                          ││
│ ├──────────┬──────────┬──────────┬──────────┬────────────┤│
│ │ Task     │ Cycle    │ Assigned │ Progress │ Actions    ││
│ ├──────────┼──────────┼──────────┼──────────┼────────────┤│
│ │ KPI Nov  │ Nov 2025 │   10     │ 6/10     │ [View]     ││
│ │ Sales    │          │ employees│ completed│ [Edit]     ││
│ ├──────────┼──────────┼──────────┼──────────┼────────────┤│
│ │ Content  │ Nov 2025 │    5     │ 2/5      │ [View]     ││
│ │ Creation │          │ employees│ completed│ [Edit]     ││
│ └──────────┴──────────┴──────────┴──────────┴────────────┘│
└─────────────────────────────────────────────────────────────┘
```

#### 1.2 Create Task Flow

**Step 1: Task Info**

```
┌─────────────────────────────────────────────────┐
│ Create New Task                            [×] │
├─────────────────────────────────────────────────┤
│                                                  │
│ Task Title *                                     │
│ ┌──────────────────────────────────────────────┐│
│ │ KPI Bán hàng tháng 11                        ││
│ └──────────────────────────────────────────────┘│
│                                                  │
│ Description                                      │
│ ┌──────────────────────────────────────────────┐│
│ │ Mỗi nhân viên cần:                           ││
│ │ - Chăm sóc 100 khách hàng                    ││
│ │ - Đạt doanh số 50 triệu                      ││
│ └──────────────────────────────────────────────┘│
│                                                  │
│ Department *                                     │
│ ┌──────────────────────────────────────────────┐│
│ │ Phòng Kinh Doanh              [▼]            ││
│ └──────────────────────────────────────────────┘│
│                                                  │
│ ☐ Team Task (toàn phòng cùng làm)              │
│                                                  │
│                     [Cancel]  [Next: Set Period]│
└─────────────────────────────────────────────────┘
```

**Step 2: Set Period**

```
┌─────────────────────────────────────────────────┐
│ Set Task Period                            [×] │
├─────────────────────────────────────────────────┤
│                                                  │
│ Period Start *                                   │
│ ┌──────────────────────────────────────────────┐│
│ │ 2025-11-01                    📅             ││
│ └──────────────────────────────────────────────┘│
│                                                  │
│ Period End *                                     │
│ ┌──────────────────────────────────────────────┐│
│ │ 2025-11-30                    📅             ││
│ └──────────────────────────────────────────────┘│
│                                                  │
│                                [Back]  [Next: Assign]│
└─────────────────────────────────────────────────┘
```

**Step 3: Assign Employees**

```
┌─────────────────────────────────────────────────┐
│ Assign Employees                           [×] │
├─────────────────────────────────────────────────┤
│                                                  │
│ ◉ Assign all employees in department (10)       │
│ ○ Select specific employees                     │
│                                                  │
│ ┌──────────────────────────────────────────────┐│
│ │ ☑ Select All                                 ││
│ │                                              ││
│ │ ☑ Nguyễn Văn A    (Nhân viên)              ││
│ │ ☑ Trần Thị B      (Nhân viên)              ││
│ │ ☑ Lê Văn C        (Trưởng nhóm)            ││
│ │ ... 7 more employees                        ││
│ └──────────────────────────────────────────────┘│
│                                                  │
│                        [Back]  [Create Task ✓]│
└─────────────────────────────────────────────────┘
```

#### 1.3 Approval Queue Page

```
┌─────────────────────────────────────────────────────────────┐
│ 🔔 Pending Approvals (8)                    Filter: [All ▼]│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ ✓ KPI Bán hàng tháng 11                                  ││
│ │ Nguyễn Văn A - Phòng Kinh Doanh                          ││
│ │ Completed: 2 hours ago (2025-11-25 16:30)                ││
│ │                                                           ││
│ │ [View Details]     [✅ Approve]     [❌ Reject]          ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ ✓ Content Creation - 3 Videos                            ││
│ │ Trần Thị B - Phòng Marketing                             ││
│ │ Completed: 5 hours ago (2025-11-25 13:15)                ││
│ │                                                           ││
│ │ Note: "Đã hoàn thành 3 videos:                           ││
│ │ - Video 1: 1,500 views                                    ││
│ │ - Video 2: 2,000 views                                    ││
│ │ - Video 3: 1,200 views"                                   ││
│ │                                                           ││
│ │ [View Details]     [✅ Approve]     [❌ Reject]          ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Reject Modal:**

```
┌─────────────────────────────────────────────────┐
│ Reject Task                                [×] │
├─────────────────────────────────────────────────┤
│                                                  │
│ Task: KPI Bán hàng tháng 11                     │
│ Employee: Nguyễn Văn A                           │
│                                                  │
│ Reason for rejection *                           │
│ ┌──────────────────────────────────────────────┐│
│ │ Chưa đủ bằng chứng hoàn thành, cần bổ sung  ││
│ │ báo cáo chi tiết và screenshot minh chứng   ││
│ └──────────────────────────────────────────────┘│
│                                                  │
│                          [Cancel]  [Reject ❌]│
└─────────────────────────────────────────────────┘
```

---

### 2. Employee Dashboard

#### 2.1 My Tasks Page

```
┌─────────────────────────────────────────────────────────────┐
│ 📝 My Tasks                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│ │ IN PROGRESS │  │  COMPLETED  │  │   APPROVED  │         │
│ │      3      │  │      1      │  │     12      │         │
│ └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 🚨 Rejected Tasks (1)                                    ││
│ ├─────────────────────────────────────────────────────────┤│
│ │ ❌ KPI Bán hàng tháng 11                                ││
│ │    Rejected by: Manager A                                ││
│ │    Reason: "Chưa đủ bằng chứng hoàn thành..."           ││
│ │                                           [Fix Now →]    ││
│ └─────────────────────────────────────────────────────────┘│
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 📋 In Progress (3)                                       ││
│ ├─────────────────────────────────────────────────────────┤│
│ │ 🔵 KPI Bán hàng tháng 11                                ││
│ │    Due: Nov 30, 2025 (4 days left)                      ││
│ │    Status: IN_PROGRESS                                   ││
│ │                                    [Mark as Complete ✓] ││
│ │                                                          ││
│ │ 🔵 Content Creation - 3 Videos                          ││
│ │    Due: Nov 30, 2025 (4 days left)                      ││
│ │    Status: IN_PROGRESS                                   ││
│ │                                    [Mark as Complete ✓] ││
│ └─────────────────────────────────────────────────────────┘│
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ ⏳ Waiting Approval (1)                                  ││
│ ├─────────────────────────────────────────────────────────┤│
│ │ ⏳ Customer Service KPI                                  ││
│ │    Completed: 2 hours ago                                ││
│ │    Waiting for manager approval...                       ││
│ └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

#### 2.2 Task Detail Modal (Employee View)

```
┌─────────────────────────────────────────────────────────────┐
│ 📋 Task Details                                        [×] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ KPI Bán hàng tháng 11                                       │
│ Status: 🔵 IN PROGRESS                                       │
│ Due: Nov 30, 2025 (4 days left)                             │
│                                                              │
│ ─────────────────────────────────────────────────────────  │
│                                                              │
│ 📝 Description:                                              │
│ Mỗi nhân viên cần:                                          │
│ - Chăm sóc ít nhất 100 khách hàng                          │
│ - Đạt doanh số 50 triệu                                     │
│ - Hoàn thành báo cáo tuần                                   │
│                                                              │
│ ─────────────────────────────────────────────────────────  │
│                                                              │
│ 📅 Period:                                                   │
│ Nov 1, 2025 - Nov 30, 2025                                  │
│                                                              │
│ 👤 Assigned to: You                                          │
│ 🏢 Department: Phòng Kinh Doanh                             │
│                                                              │
│ ─────────────────────────────────────────────────────────  │
│                                                              │
│ ✅ Ready to mark as complete?                                │
│                                                              │
│                         [Cancel]  [Mark as Complete ✓]    │
└─────────────────────────────────────────────────────────────┘
```

**Complete Confirmation:**

```
┌─────────────────────────────────────────────────┐
│ ✓ Confirm Completion                       [×] │
├─────────────────────────────────────────────────┤
│                                                  │
│ Are you sure you want to mark this task as      │
│ completed?                                       │
│                                                  │
│ Task: KPI Bán hàng tháng 11                     │
│                                                  │
│ After marking as complete, your manager will     │
│ review and approve/reject your submission.       │
│                                                  │
│                        [Cancel]  [Complete ✓]│
└─────────────────────────────────────────────────┘
```

---

### 3. Mobile UI Suggestions

#### 3.1 Mobile - Employee View

```
┌─────────────────────┐
│  ☰  My Tasks    🔔 │
├─────────────────────┤
│                     │
│ 📊 Summary          │
│ ┌─────────────────┐ │
│ │ In Progress   3 │ │
│ │ Completed     1 │ │
│ │ Approved     12 │ │
│ └─────────────────┘ │
│                     │
│ 🚨 Rejected (1)     │
│ ┌─────────────────┐ │
│ │ KPI Nov         │ │
│ │ ❌ Fix needed   │ │
│ │ [View Details →]│ │
│ └─────────────────┘ │
│                     │
│ 📋 In Progress      │
│ ┌─────────────────┐ │
│ │ 🔵 KPI Nov      │ │
│ │ Due: 4 days     │ │
│ │ [Complete ✓]    │ │
│ └─────────────────┘ │
│                     │
│ ┌─────────────────┐ │
│ │ 🔵 Content      │ │
│ │ Due: 4 days     │ │
│ │ [Complete ✓]    │ │
│ └─────────────────┘ │
│                     │
└─────────────────────┘
```

---

## 🎯 Best Practices

### 1. For Managers

#### Task Creation

- ✅ Viết rõ ràng title và description
- ✅ Set deadline hợp lý (ít nhất 1 tuần)
- ✅ Gán toàn bộ phòng ban nếu là team task
- ✅ Review lại trước khi assign

#### Approval Process

- ✅ Review tasks hàng ngày
- ✅ Provide constructive feedback khi reject
- ✅ Approve nhanh nếu đạt yêu cầu
- ✅ Track completion rate của team

#### Communication

- ✅ Notify nhân viên khi có task mới
- ✅ Explain rõ lý do reject
- ✅ Encourage nhân viên complete sớm
- ✅ Celebrate achievements

### 2. For Employees

#### Task Execution

- ✅ Đọc kỹ description trước khi làm
- ✅ Complete đúng deadline
- ✅ Double-check trước khi submit
- ✅ Add note nếu cần thiết

#### When Rejected

- ✅ Đọc kỹ rejection reason
- ✅ Fix và complete lại nhanh
- ✅ Contact manager nếu không rõ
- ✅ Learn from mistakes

### 3. For System Admins

#### Performance

- ✅ Index database properly
- ✅ Cache frequently accessed data
- ✅ Paginate large lists
- ✅ Optimize queries

#### Monitoring

- ✅ Track API response times
- ✅ Monitor task completion rates
- ✅ Alert on deadline misses
- ✅ Generate weekly reports

---

## 🔧 Common Use Cases

### Use Case 1: Monthly Sales KPI

```javascript
// Manager creates monthly sales task
const task = await POST('/tasks', {
  title: 'KPI Bán hàng tháng 11',
  description: 'Đạt doanh số 50 triệu',
  departmentId: 'dept_sales',
  level: 1,
});

const cycle = await POST('/task-cycles', {
  taskId: task.id,
  periodStart: '2025-11-01',
  periodEnd: '2025-11-30',
});

// Assign to all sales employees
await POST('/task-assignments/assign-to-cycle', {
  cycleId: cycle.id,
  departmentId: 'dept_sales',
});
```

### Use Case 2: Quarterly Team Goal

```javascript
// Manager creates quarterly team goal
const task = await POST('/tasks', {
  title: 'Q4 Revenue Target - 1 Billion',
  description: 'Team target: 1 billion revenue',
  departmentId: 'dept_sales',
  isTaskTeam: true, // Team task
});

const cycle = await POST('/task-cycles', {
  taskId: task.id,
  periodStart: '2025-10-01',
  periodEnd: '2025-12-31',
});

// Assign to all team members
await POST('/task-assignments/assign-to-cycle', {
  cycleId: cycle.id,
  departmentId: 'dept_sales',
});

// Each employee contributes to team goal
// Manager approves individual contributions
```

### Use Case 3: Content Creation Task

```javascript
// Manager creates content task
const task = await POST('/tasks', {
  title: 'Create 3 TikTok Videos (1000+ views)',
  description: 'Each video must reach at least 1000 views',
  departmentId: 'dept_marketing',
  level: 2,
});

// Employee completes with evidence
await POST('/task-assignments/assign_123/complete');

// Manager reviews videos and approves
await POST('/task-assignments/assign_123/approve');
```

---

## 📊 Reporting & Analytics

### Dashboard Metrics

#### For Managers

```javascript
// Get department completion rate
GET /task-assignments?departmentId=dept_sales&status=APPROVED

// Pending approvals count
GET /task-assignments/pending-approvals?departmentId=dept_sales

// Team performance by employee
GET /task-assignments?departmentId=dept_sales&status=APPROVED
// Group by employeeId and count
```

#### For Employees

```javascript
// My completion rate
GET / task - assignments / employee / emp_001;

// Count APPROVED vs total
```

### Manager Workflow

- [ ] Create Task template
- [ ] Create Task Cycle (period)
- [ ] Assign employees to cycle
- [ ] Monitor progress
- [ ] Review and approve/reject completions

### Employee Workflow

- [ ] View assigned tasks
- [ ] Work on tasks
- [ ] Mark as complete when done
- [ ] Fix if rejected
- [ ] Track approved tasks

---
