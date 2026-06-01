# API: Tra cứu hóa đơn bảo hành

Endpoint cho màn tra cứu bảo hành: khách nhập **số điện thoại** hoặc **serial/IMEI**, hệ thống tự nhận diện loại input và trả về danh sách hóa đơn kèm thông tin bảo hành.

Endpoint **public** (không cần Authorization header).

Base URL phụ thuộc môi trường (ví dụ `https://api.hitaothom.com`).

---

## Endpoint

```
POST /kiotviet/invoices
Content-Type: application/json
```

> HTTP status khi thành công là **200** (không phải 201).

### Request body

| Trường | Bắt buộc | Kiểu | Mô tả |
|--------|----------|------|--------|
| `phoneOrSerial` | Có | `string` | Số điện thoại khách hàng **hoặc** Serial/IMEI sản phẩm. Không được rỗng. |

```json
{
  "phoneOrSerial": "0912345678"
}
```

```json
{
  "phoneOrSerial": "357137340314839"
}
```

### Cách hệ thống nhận diện loại input

FE chỉ cần gửi 1 trường `phoneOrSerial`, **không cần** báo đó là SĐT hay serial. Backend tự nhận diện:

- Sau khi loại bỏ khoảng trắng, `-`, `(`, `)`:
  - Chuỗi **chỉ gồm 9–11 chữ số** → tra theo **số điện thoại**.
  - Còn lại (vd IMEI 14–18 số, hoặc serial có chữ) → tra theo **serial/IMEI**.

### Nguồn dữ liệu

1. Tra trên **KiotViet** trước (chỉ hóa đơn đã hoàn thành, `status = 1`).
2. Nếu KiotViet không có kết quả → tra tiếp ở **Google Apps Script** (dữ liệu hóa đơn cũ).
3. Không nơi nào có → trả về mảng rỗng `[]`.

---

## Response 200

Trả về **mảng** `InvoiceResponseDto[]`. Có thể rỗng nếu không tìm thấy.

```json
[
  {
    "id": 123456,
    "code": "HD000789",
    "createdDate": "2024-01-15T09:30:00.0000000",
    "total": 25000000,
    "totalPayment": 25000000,
    "status": 1,
    "customerId": 98765,
    "customerCode": "KH000123",
    "customerName": "Nguyễn Văn A",
    "invoiceDetails": [
      {
        "productId": 555,
        "productName": "iPhone 16 Pro Max 256GB Desert Titanium",
        "productCode": "357137340314839",
        "quantity": 1,
        "price": 25000000,
        "subTotal": 25000000,
        "serialNumbers": ["357137340314839"]
      }
    ],
    "note": "Giao hàng tận nơi",
    "warranty": {
      "warrantyDays": 365,
      "warrantyStartDate": "2024-01-15T00:00:00.000Z",
      "warrantyEndDate": "2025-01-14T00:00:00.000Z",
      "remainingDays": 45,
      "warrantyType": "Bảo Hành CARE⁺ PRO MAX",
      "status": "Còn hiệu lực"
    }
  }
]
```

### Mô tả các trường hóa đơn (`InvoiceResponseDto`)

| Trường | Kiểu | Mô tả |
|--------|------|--------|
| `id` | `number` | ID hóa đơn trên KiotViet (có thể là `0` nếu nguồn từ Google Script) |
| `code` | `string` | Mã hóa đơn |
| `createdDate` | `string` (ISO) | Ngày tạo / ngày mua hàng |
| `total` | `number` | Tổng tiền (VND) |
| `totalPayment` | `number` | Tổng tiền sau giảm giá (VND) |
| `status` | `number \| undefined` | Trạng thái hóa đơn (1 = hoàn thành) |
| `customerId` | `number` | ID khách hàng (`0` nếu nguồn Google Script) |
| `customerCode` | `string` | Mã khách hàng (rỗng nếu nguồn Google Script) |
| `customerName` | `string` | Tên khách hàng |
| `invoiceDetails` | `InvoiceProductDto[]` | Danh sách sản phẩm — **đã loại bỏ các dòng gói bảo hành** (xem mục bên dưới) |
| `note` | `string \| undefined` | Ghi chú hóa đơn |
| `warranty` | `WarrantyInfoDto \| undefined` | Thông tin bảo hành. **Vắng mặt** nếu hóa đơn không có gói bảo hành tính được số ngày |

### Mô tả sản phẩm (`InvoiceProductDto`)

| Trường | Kiểu | Mô tả |
|--------|------|--------|
| `productId` | `number` | ID sản phẩm (`0` nếu nguồn Google Script) |
| `productName` | `string` | Tên sản phẩm |
| `productCode` | `string` | Mã sản phẩm (với máy thường là IMEI) |
| `quantity` | `number` | Số lượng |
| `price` | `number` | Giá bán (VND) |
| `subTotal` | `number` | Thành tiền (VND) |
| `serialNumbers` | `string[] \| undefined` | Danh sách Serial/IMEI |

### Mô tả bảo hành (`WarrantyInfoDto`)

| Trường | Kiểu | Mô tả |
|--------|------|--------|
| `warrantyDays` | `number` | Tổng số ngày bảo hành theo gói |
| `warrantyStartDate` | `string` (ISO) | Ngày bắt đầu (= ngày mua, set về 00:00) |
| `warrantyEndDate` | `string` (ISO) | Ngày kết thúc bảo hành |
| `remainingDays` | `number` | Số ngày còn lại (≥ 0, đã làm tròn lên) |
| `warrantyType` | `string` | Tên gói bảo hành |
| `status` | `"Còn hiệu lực" \| "Hết hạn"` | `Còn hiệu lực` khi `remainingDays > 0`, ngược lại `Hết hạn` |

---

## Logic bảo hành (FE cần lưu ý)

1. **Dòng gói bảo hành bị loại khỏi `invoiceDetails`.** Các sản phẩm có tên chứa một trong các gói dưới đây không xuất hiện trong `invoiceDetails`; thay vào đó được tổng hợp vào trường `warranty`. FE chỉ render máy/phụ kiện trong `invoiceDetails`, và render riêng `warranty`.

2. **Số ngày bảo hành theo gói** (chọn gói có số ngày cao nhất nếu hóa đơn có nhiều gói):

   | Tên gói (`warrantyType`) | Số ngày |
   |--------------------------|---------|
   | `Bảo Hành CARE⁺ PRO MAX` | 365 |
   | `Bảo Hành CARE⁺ PRO` | 180 |
   | `Bảo Hành Mở Rộng` | 90 |
   | `Bảo Hành Tiết Kiệm` | 0 |

3. **Khi nào `warranty` vắng mặt?** Nếu hóa đơn không có gói bảo hành nào, hoặc chỉ có gói `Bảo Hành Tiết Kiệm` (0 ngày) → trường `warranty` **không có** trong response. FE phải kiểm tra `if (invoice.warranty)` trước khi đọc.

---

## Trường hợp không tìm thấy

Trả về **mảng rỗng** (HTTP vẫn 200):

```json
[]
```

FE nên hiển thị thông báo "Không tìm thấy hóa đơn với thông tin này".

---

## Lỗi

| HTTP | Khi nào | Body (mẫu) |
|------|---------|------------|
| `400` | `phoneOrSerial` thiếu hoặc rỗng | `{ "message": "Vui lòng cung cấp số điện thoại hoặc serial/IMEI" }` |
| `500` | KiotViet chưa cấu hình, hoặc lỗi khi tra cứu | `{ "message": "Không thể tra cứu hóa đơn từ KiotViet" }` |
| `503` | Không thể kết nối / lấy token KiotViet | `{ "message": "Không thể kết nối tới KiotViet API" }` |

> Lưu ý: validation rỗng do `class-validator` (`@IsNotEmpty`) có thể trả body dạng `{ "message": ["phoneOrSerial should not be empty"], "error": "Bad Request", "statusCode": 400 }`. FE nên xử lý cả 2 dạng `message` (string hoặc string[]).

---

## Ví dụ gọi API

```bash
# Tra theo số điện thoại
curl -X POST https://api.hitaothom.com/kiotviet/invoices \
  -H "Content-Type: application/json" \
  -d '{ "phoneOrSerial": "0912345678" }'

# Tra theo IMEI
curl -X POST https://api.hitaothom.com/kiotviet/invoices \
  -H "Content-Type: application/json" \
  -d '{ "phoneOrSerial": "357137340314839" }'
```

### Gợi ý xử lý phía FE

```ts
const res = await fetch(`${BASE_URL}/kiotviet/invoices`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phoneOrSerial: input.trim() }),
});

if (!res.ok) {
  // 400 / 500 / 503 — đọc message để hiển thị
  const err = await res.json();
  showError(Array.isArray(err.message) ? err.message[0] : err.message);
  return;
}

const invoices = await res.json(); // InvoiceResponseDto[]

if (invoices.length === 0) {
  showMessage('Không tìm thấy hóa đơn với thông tin này.');
  return;
}

for (const inv of invoices) {
  renderProducts(inv.invoiceDetails); // máy/phụ kiện (đã loại gói bảo hành)

  if (inv.warranty) {
    renderWarranty(inv.warranty);
    if (inv.warranty.status === 'Còn hiệu lực') {
      showBadge(`Còn ${inv.warranty.remainingDays} ngày bảo hành`);
    } else {
      showBadge('Hết hạn bảo hành');
    }
  } else {
    showMessage('Hóa đơn không có gói bảo hành.');
  }
}
```
