# API: Voucher khách hàng

Gồm 2 nhóm endpoint:

1. **`POST /kiotviet/vouchers`** — Tra cứu voucher của khách theo SĐT (dành cho màn tra cứu bảo hành / POS).
2. **`/voucher-rules`** — CRUD cấu hình rule voucher (dành cho trang admin chỉnh sửa chính sách).

Tất cả endpoint đều **public** (không cần Authorization header).

Base URL phụ thuộc môi trường (ví dụ `https://api.hitaothom.com`).

---

## 1. Tra cứu voucher theo SĐT

```
POST /kiotviet/vouchers
Content-Type: application/json
```

### Request body

| Trường | Bắt buộc | Kiểu | Mô tả |
|--------|----------|------|--------|
| `phone` | Có | `string` | Số điện thoại khách hàng |

```json
{
  "phone": "0912345678"
}
```

### Response 200

```json
{
  "phone": "0912345678",
  "customerId": 123456,
  "customerName": "Nguyễn Văn A",
  "totalInvoices": 3,
  "voucher": {
    "ruleId": "clxyz...",
    "discountVnd": 300000,
    "label": "Ưu đãi Care+ Pro Max còn hạn",
    "conditionType": "WARRANTY_ACTIVE",
    "flags": ["careProMax"]
  },
  "candidates": [
    {
      "ruleId": "clxyz...",
      "conditionType": "INVOICE_COUNT_TIER",
      "discountVnd": 200000,
      "label": "Khách thân thiết - 3 hóa đơn",
      "flags": []
    },
    {
      "ruleId": "clabc...",
      "conditionType": "WARRANTY_ACTIVE",
      "discountVnd": 300000,
      "label": "Ưu đãi Care+ Pro Max còn hạn",
      "flags": ["careProMax"]
    }
  ]
}
```

### Mô tả các trường response

| Trường | Kiểu | Mô tả |
|--------|------|--------|
| `phone` | `string` | SĐT đã tra cứu |
| `customerId` | `number \| undefined` | ID khách trên KiotViet. `undefined` nếu không tìm thấy khách |
| `customerName` | `string \| undefined` | Tên khách. `undefined` nếu không tìm thấy |
| `totalInvoices` | `number` | Tổng hóa đơn **hoàn thành** (status = 1) của khách |
| `voucher` | `VoucherDto \| null` | Voucher tốt nhất được áp dụng. `null` nếu không đủ điều kiện |
| `voucher.ruleId` | `string` | ID của rule trong DB |
| `voucher.discountVnd` | `number` | Số tiền giảm (VND) |
| `voucher.label` | `string` | Nhãn hiển thị cho khách |
| `voucher.conditionType` | `string` | Loại điều kiện đã match (`INVOICE_COUNT_TIER` hoặc `WARRANTY_ACTIVE`) |
| `voucher.flags` | `string[]` | Cờ tùy biến (vd `["careProMax"]` để FE render icon riêng) |
| `candidates` | `VoucherCandidateDto[]` | Tất cả rule hợp lệ (để FE hiển thị chi tiết lý do) |

### Logic chọn voucher

- Hệ thống tính **tất cả** rule đang bật (`isActive = true`) mà khách thoả điều kiện → `candidates`.
- Trong nhóm `INVOICE_COUNT_TIER`: chỉ giữ tier có giá trị **cao nhất** (khách 4 đơn → chỉ lấy tier 4, không lấy tier 1, 2, 3).
- Chọn voucher trong `candidates` có `discountVnd` **cao nhất** → gán vào `voucher`.
- Hoà điểm (cùng `discountVnd`) → lấy rule có `discountVnd` xuất hiện đầu tiên trong danh sách đã sắp theo `discountVnd desc`.

### Trường hợp không tìm thấy khách

```json
{
  "phone": "0999999999",
  "customerId": null,
  "customerName": null,
  "totalInvoices": 0,
  "voucher": null,
  "candidates": []
}
```

### Xử lý phía FE — gợi ý

```ts
// Hiển thị nhãn voucher
if (response.voucher) {
  showBanner(`Giảm ${formatVnd(response.voucher.discountVnd)} — ${response.voucher.label}`);

  // Icon đặc biệt cho Care Pro Max
  if (response.voucher.flags.includes('careProMax')) {
    showCareProMaxBadge();
  }
} else if (response.customerId) {
  showMessage('Khách chưa đủ điều kiện nhận voucher.');
} else {
  showMessage('Không tìm thấy khách hàng với SĐT này.');
}
```

### Lỗi

| HTTP | Khi nào |
|------|---------|
| `400` | Thiếu hoặc `phone` rỗng |
| `500` | KiotViet chưa cấu hình hoặc lỗi hệ thống |

---

## 2. Quản lý Voucher Rule (CRUD)

Base path: `/voucher-rules`

Dùng cho trang admin để thêm / sửa / tắt / xoá rule mà **không cần deploy lại**.

### 2.1 Enum `conditionType`

| Giá trị | Ý nghĩa | `conditionValue` |
|---------|---------|-----------------|
| `INVOICE_COUNT_TIER` | Khách có đủ N hóa đơn hoàn thành | Số nguyên dưới dạng string, vd `"3"` |
| `WARRANTY_ACTIVE` | Khách có gói bảo hành còn hiệu lực | Tên gói bảo hành, vd `"Bảo Hành CARE⁺ PRO MAX"` |

---

### `GET /voucher-rules` — Danh sách

```
GET /voucher-rules
GET /voucher-rules?isActive=true
GET /voucher-rules?conditionType=INVOICE_COUNT_TIER
GET /voucher-rules?conditionType=WARRANTY_ACTIVE&isActive=true
```

#### Query params (tất cả optional)

| Param | Kiểu | Mô tả |
|-------|------|--------|
| `conditionType` | `INVOICE_COUNT_TIER \| WARRANTY_ACTIVE` | Lọc theo loại điều kiện |
| `isActive` | `boolean` (`true` / `false`) | Lọc theo trạng thái. Bỏ trống = lấy tất cả |

#### Response 200

```json
[
  {
    "id": "clxyz...",
    "name": "Khách thân thiết - 1 hóa đơn",
    "conditionType": "INVOICE_COUNT_TIER",
    "conditionValue": "1",
    "discountVnd": 100000,
    "flags": [],
    "isActive": true,
    "createdAt": "2026-05-05T16:24:32.000Z",
    "updatedAt": "2026-05-05T16:24:32.000Z"
  },
  {
    "id": "clabc...",
    "name": "Ưu đãi Care+ Pro Max còn hạn",
    "conditionType": "WARRANTY_ACTIVE",
    "conditionValue": "Bảo Hành CARE⁺ PRO MAX",
    "discountVnd": 300000,
    "flags": ["careProMax"],
    "isActive": true,
    "createdAt": "2026-05-05T16:24:32.000Z",
    "updatedAt": "2026-05-05T16:24:32.000Z"
  }
]
```

---

### `GET /voucher-rules/:id` — Chi tiết

```
GET /voucher-rules/clxyz...
```

Response 200: object `VoucherRule` như trên.
Response 404: `{ "message": "Không tìm thấy voucher rule với id=..." }`.

---

### `POST /voucher-rules` — Tạo mới

```
POST /voucher-rules
Content-Type: application/json
```

#### Request body

| Trường | Bắt buộc | Kiểu | Mô tả |
|--------|----------|------|--------|
| `name` | Có | `string` | Nhãn hiển thị |
| `conditionType` | Có | `enum` | `INVOICE_COUNT_TIER` hoặc `WARRANTY_ACTIVE` |
| `conditionValue` | Có | `string` | Giá trị điều kiện (xem bảng enum) |
| `discountVnd` | Có | `number` (integer ≥ 0) | Số tiền giảm (VND) |
| `flags` | Không | `string[]` | Mặc định `[]` |
| `isActive` | Không | `boolean` | Mặc định `true` |

**Ví dụ — Tier hóa đơn:**

```json
{
  "name": "Khách thân thiết - 5+ hóa đơn",
  "conditionType": "INVOICE_COUNT_TIER",
  "conditionValue": "5",
  "discountVnd": 500000
}
```

**Ví dụ — Bảo hành:**

```json
{
  "name": "Ưu đãi Care+ Pro còn hạn",
  "conditionType": "WARRANTY_ACTIVE",
  "conditionValue": "Bảo Hành CARE⁺ PRO",
  "discountVnd": 150000,
  "flags": ["carePro"]
}
```

Response 201: object `VoucherRule` vừa tạo.

#### Lỗi validation

| HTTP | Khi nào |
|------|---------|
| `400` | `conditionType = INVOICE_COUNT_TIER` nhưng `conditionValue` không phải số nguyên |
| `400` | `conditionType = WARRANTY_ACTIVE` nhưng `conditionValue` rỗng |
| `400` | Thiếu trường bắt buộc |

---

### `PATCH /voucher-rules/:id` — Cập nhật từng phần

```
PATCH /voucher-rules/clxyz...
Content-Type: application/json
```

Tất cả trường đều **optional** — chỉ gửi trường cần thay đổi.

**Ví dụ — Chỉ đổi discount:**

```json
{ "discountVnd": 350000 }
```

**Ví dụ — Tắt rule (không xoá):**

```json
{ "isActive": false }
```

**Ví dụ — Đổi tier:**

```json
{
  "conditionType": "INVOICE_COUNT_TIER",
  "conditionValue": "6",
  "discountVnd": 600000,
  "name": "Khách thân thiết - 6+ hóa đơn"
}
```

Response 200: object `VoucherRule` sau khi cập nhật.

---

### `DELETE /voucher-rules/:id` — Xoá

```
DELETE /voucher-rules/clxyz...
```

Response 200:

```json
{ "id": "clxyz...", "deleted": true }
```

Response 404: nếu không tìm thấy.

> **Lưu ý**: nên dùng `PATCH { "isActive": false }` để tắt thay vì xoá, để giữ lịch sử.

---

## 3. Các rule mặc định sau khi seed

| name | conditionType | conditionValue | discountVnd | flags |
|------|--------------|----------------|-------------|-------|
| Khách thân thiết - 1 hóa đơn | `INVOICE_COUNT_TIER` | `"1"` | 100,000 | `[]` |
| Khách thân thiết - 2 hóa đơn | `INVOICE_COUNT_TIER` | `"2"` | 150,000 | `[]` |
| Khách thân thiết - 3 hóa đơn | `INVOICE_COUNT_TIER` | `"3"` | 200,000 | `[]` |
| Khách thân thiết - 4+ hóa đơn | `INVOICE_COUNT_TIER` | `"4"` | 300,000 | `[]` |
| Ưu đãi Care+ Pro Max còn hạn | `WARRANTY_ACTIVE` | `"Bảo Hành CARE⁺ PRO MAX"` | 300,000 | `["careProMax"]` |

---

## 4. Quy trình thêm chính sách mới (không cần deploy)

Ví dụ muốn thêm "Khách 6+ hóa đơn giảm 500K":

```bash
curl -X POST https://api.hitaothom.com/voucher-rules \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Khách thân thiết - 6+ hóa đơn",
    "conditionType": "INVOICE_COUNT_TIER",
    "conditionValue": "6",
    "discountVnd": 500000
  }'
```

Lần gọi `POST /kiotviet/vouchers` ngay sau đó sẽ áp dụng rule mới ngay — không cần restart server.
