# 📋 Task Management System V2

## 🎯 Overview

Hệ thống quản lý task đơn giản và linh hoạt với 3 bảng chính:

- **TaskV2**: Task template (thông tin chung)
- **TaskCycleV2**: Chu kỳ thực hiện task (theo tháng, quý, năm...)
- **TaskAssignment**: Gán nhân viên vào cycle (N-N relationship)

---

## 🏗️ Architecture

```
┌──────────────┐
│    TaskV2    │  ← Task template (title, description, department)
└──────┬───────┘
       │ 1:N
       ▼
┌──────────────┐
│ TaskCycleV2  │  ← Chu kỳ thực hiện (periodStart, periodEnd)
└──────┬───────┘
       │ 1:N
       ▼
┌──────────────────┐
│ TaskAssignment   │  ← Gán nhân viên (quantity, status, approval)
└────────┬─────────┘
         │ N:1
         ▼
    ┌──────────┐
    │ Employee │
    └──────────┘
```

---

## 📊 Database Schema

### TaskV2

```prisma
model TaskV2{
  id            String      @id @default(cuid())
  title         String
  description   String?
  required      Boolean     @default(true)
  level         Int         @default(1)
  isActive      Boolean     @default(true)
  isTaskTeam    Boolean     @default(false)  // DEPARTMENT task?
  departmentId  String
  userId        String

  department    Department  @relation(...)
  user          User        @relation(...)
  cycles        TaskCycleV2[]
}
```

### TaskCycleV2

```prisma
model TaskCycleV2 {
  id           String      @id @default(cuid())
  periodStart  DateTime
  periodEnd    DateTime
  taskId       String

  task         TaskV2      @relation(...)
  assignments  TaskAssignment[]
}
```

### TaskAssignment (Junction Table)

```prisma
model TaskAssignment {
  id             String      @id @default(cuid())
  cycleId        String
  employeeId     String

  // Progress tracking
  quantity       Float?      @default(0)
  status         TaskStatusV2 @default(PENDING)

  // Completion
  completedAt    DateTime?
  completedBy    String?

  // Approval
  approvedAt     DateTime?
  approvedBy     String?
  rejectedAt     DateTime?
  rejectedBy     String?
  rejectedReason String?

  cycle          TaskCycleV2 @relation(...)
  employee       Employee    @relation(...)

  @@unique([cycleId, employeeId])
}
```

---

## 🔄 Workflow

### 1. Manager Tạo Task & Cycle

```javascript
// Bước 1: Tạo Task template
const task = await POST('/tasks', {
  title: 'Doanh số tháng 11',
  description: 'Hoàn thành 50 đơn hàng',
  departmentId: 'dept_sales',
  level: 1,
  isTaskTeam: false, // false = INDIVIDUAL, true = DEPARTMENT
});

// Bước 2: Tạo Cycle cho tháng 11
const cycle = await POST('/task-cycles', {
  taskId: task.id,
  periodStart: '2025-11-01',
  periodEnd: '2025-11-30',
});

// Bước 3: Gán tất cả nhân viên trong phòng Sales
const result = await POST('/task-assignments/assign-to-cycle', {
  cycleId: cycle.id,
  departmentId: 'dept_sales',
});
// ✅ Tạo 10 assignments (nếu có 10 nhân viên)
```

### 2. Nhân Viên Làm Task

```javascript
// Bước 1: Xem tasks của mình
const myTasks = await GET('/task-assignments/employee/emp123');

// Bước 2: Cập nhật tiến độ (optional - cho task định lượng)
await POST('/task-assignments/assignment123/update-progress', {
  delta: 10,
  note: 'Bán được 10 đơn hàng',
});
// Status: PENDING → IN_PROGRESS

// Bước 3: Đánh dấu hoàn thành
await POST('/task-assignments/assignment123/complete', {
  note: 'Đã hoàn thành đủ target',
});
// Status: IN_PROGRESS → COMPLETED
```

### 3. Manager Phê Duyệt

```javascript
// Bước 1: Xem danh sách chờ duyệt
const pending = await GET('/task-assignments/pending-approvals');

// Bước 2: Approve hoặc Reject
await POST('/task-assignments/assignment123/approve', {
  approvedBy: 'manager123',
  reason: 'Great work!',
});
// Status: COMPLETED → APPROVED ✅

// Hoặc reject
await POST('/task-assignments/assignment123/reject', {
  rejectedBy: 'manager123',
  rejectedReason: 'Thiếu báo cáo',
});
// Status: COMPLETED → REJECTED ❌
```

---

## 🎨 Modules & Files

### Services

```
src/modules/tasks/services/
├── task.service.ts              ← CRUD cho TaskV2
├── task-cycle.service.ts        ← CRUD cho TaskCycleV2
└── task-assignment.service.ts   ← CRUD + workflow cho TaskAssignment
```

### Controllers

```
src/modules/tasks/controllers/
├── task.controller.ts
├── task-cycle.controller.ts
└── task-assignment.controller.ts
```

### DTOs

```
src/modules/tasks/dto/
├── task-instance/               ← TaskV2 DTOs
├── task-cycle/                  ← TaskCycleV2 DTOs
└── task-assignment/             ← TaskAssignment DTOs
    ├── create-task-assignment.dto.ts
    ├── assign-employees-to-cycle.dto.ts
    ├── update-progress.dto.ts
    ├── complete-assignment.dto.ts
    ├── approve-assignment.dto.ts
    ├── reject-assignment.dto.ts
    └── query-assignment.dto.ts
```

---

## 🚀 Quick Start

### 1. Setup Database

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

### 2. Test APIs

```bash
# Start server
npm run start:dev

# Swagger UI
http://localhost:3000/api
```

### 3. Example Flow

```javascript
// 1. Tạo task + cycle + gán nhân viên (1 API call)
const result = await POST('/task-assignments/assign-to-cycle', {
  cycleId: 'cycle123',
  departmentId: 'dept_sales',
});

// 2. Nhân viên update progress
await POST('/task-assignments/:id/update-progress', {
  delta: 10,
});

// 3. Nhân viên complete
await POST('/task-assignments/:id/complete', {
  note: 'Done!',
});

// 4. Manager approve
await POST('/task-assignments/:id/approve', {
  approvedBy: 'manager123',
});
```

---

## 📚 Documentation

- **[TASK_ASSIGNMENT_API.md](./TASK_ASSIGNMENT_API.md)** - Chi tiết API endpoints
- **[TASK_WORKFLOW.md](../../../TASK_WORKFLOW.md)** - Business workflow

---

## 🎯 Key Features

### ✅ INDIVIDUAL Tasks

- Mỗi nhân viên có assignment riêng
- Mỗi người có quantity/progress riêng
- Manager approve/reject từng người

### ✅ DEPARTMENT Tasks

- Cả team cùng làm 1 task
- Mỗi người đóng góp vào target chung
- Total progress = SUM(quantity của tất cả assignments)

### ✅ Flexible Assignment

- Gán theo danh sách employeeIds
- Gán theo phòng ban (tất cả nhân viên active)
- Bulk assign với 1 API call

### ✅ Progress Tracking

- Mỗi nhân viên có quantity riêng
- History trong database (TaskAssignment records)
- Real-time progress dashboard

### ✅ Approval Workflow

- Status flow: PENDING → IN_PROGRESS → COMPLETED → APPROVED/REJECTED
- Mỗi nhân viên có approval status riêng
- Reject có thể fix và complete lại

---

## 💡 Use Cases

### Use Case 1: Sales Team - Individual Targets

```
Task: "Doanh số tháng 11"
Type: INDIVIDUAL
Target: 50 đơn/người

→ Tạo 10 assignments (1 cho mỗi nhân viên)
→ Mỗi người cần đạt 50 đơn
→ Manager approve từng người riêng
```

### Use Case 2: Marketing Team - Shared Goal

```
Task: "Toàn đội đạt 350 đơn"
Type: DEPARTMENT
Target: 350 đơn cho cả team

→ Tạo 10 assignments (1 cho mỗi nhân viên)
→ Mỗi người đóng góp tùy khả năng
→ Total = 350 (A: 50, B: 60, C: 40, ...)
→ Manager approve từng người dựa trên đóng góp
```

### Use Case 3: Content Team - Qualitative Tasks

```
Task: "Hoàn thành 3 video TikTok trên 1000 views"
Type: INDIVIDUAL (không có quantity)

→ Nhân viên complete kèm link videos
→ Manager review và approve/reject
→ Không cần tracking quantity
```

---

## 🔒 Security

- **JWT Authentication**: Tất cả endpoints cần auth
- **User Ownership**: Chỉ access được tasks của userId mình
- **Employee Permission**: Chỉ complete được assignment của mình
- **Manager Permission**: Approve/reject cần role ADMIN/USER

---

## 📈 Reporting APIs

```javascript
// 1. Team progress overview
GET /task-assignments/cycle/:cycleId/progress

// 2. Pending approvals (for manager)
GET /task-assignments/pending-approvals?departmentId=dept_sales

// 3. Employee tasks
GET /task-assignments/employee/:employeeId?status=IN_PROGRESS

// 4. All assignments by filter
GET /task-assignments?cycleId=...&status=...&departmentId=...
```

---
