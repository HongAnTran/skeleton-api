# API: Hóa đơn KiotViet theo nhân viên bán (`GET /kiotviet/invoices/by-user`)

Tài liệu cho FE tích hợp response, đặc biệt object `report` và `report.iphoneReport`.

Base URL thực tế phụ thuộc môi trường triển khai (ví dụ `https://{host}/kiotviet/invoices/by-user`).

---

## Request

| Tham số | Bắt buộc | Kiểu | Mô tả |
|--------|----------|------|--------|
| `userId` | Có | `number` | ID nhân viên trên KiotViet (lọc theo `soldById`). |
| `fromPurchaseDate` | Không | ISO 8601 string | Lọc đơn từ ngày (theo API KiotViet). |
| `toPurchaseDate` | Không | ISO 8601 string | Lọc đơn đến ngày. |
| `productNameContains` | Không | `string` | Chỉ tính vào **`report.iphoneReport`** các dòng có `productName` chứa chuỗi (không phân biệt hoa thường). Các field khác của `report` (doanh thu, bảo hành, v.v.) **không** bị lọc bởi tham số này. |

**Ví dụ**

```http
GET /kiotviet/invoices/by-user?userId=12345&fromPurchaseDate=2025-01-01T00:00:00&toPurchaseDate=2025-03-31T23:59:59&productNameContains=16%20Pro%20Max
```

---

## Response (200)

```ts
interface GetInvoicesByUserResponse {
  data: InvoiceResponse[]; // danh sách hóa đơn (cùng shape đã dùng ở module tra cứu)
  report: UserInvoicesReport;
}
```

### `report: UserInvoicesReport`

| Field | Kiểu | Ý nghĩa |
|-------|------|--------|
| `totalOrders` | `number` | **Lưu ý tên field:** hiện backend gán giá trị này bằng **tổng quantity các dòng có mã giống IMEI** (máy), không phải số lượng hóa đơn. FE nên hiển thị theo đúng semantics nội bộ (ví dụ nhãn “Tổng số máy (IMEI)” nếu cần). |
| `totalValue` | `number` | Tổng `totalPayment` các đơn sau khi xử lý. |
| `accessoryRevenue` | `number` | Doanh thu phụ kiện (xem logic backend). |
| `warrantyRevenue` | `number` | Doanh thu dòng bảo hành. |
| `warrantyOrderCount` | `number` | Số đơn có gói bảo hành. |
| `warrantyQuantity` | `number` | Tổng quantity các dòng bảo hành. |
| `warrantyBreakdown` | `WarrantyBreakdownItem[]` | Chi tiết theo loại bảo hành. |
| `revenue` | `number` | Bằng `totalValue`. |
| `iphoneReport` | `IphoneSalesReport` | Báo cáo iPhone (parse từ `productName` + nhóm Lock/QT từ `productGroup` / `categoryName`). |

```ts
interface WarrantyBreakdownItem {
  warrantyType: string;
  quantity: number;
  revenue: number;
  orderCount: number;
}
```

### `report.iphoneReport: IphoneSalesReport`

Chỉ gồm các **dòng chi tiết hóa đơn** (không tính dòng bảo hành) có:

- `productCode` dạng **IMEI** (chuỗi số 14–18 ký tự sau khi normalize), và
- `productName` parse được theo mẫu: **`iPhone … {dung lượng} … {màu}`**  
  Ví dụ: `iPhone 16 Pro Max 256GB Desert Titanium` → model `iPhone 16 Pro Max`, `256GB`, `Desert Titanium`.

| Field | Kiểu | Ý nghĩa |
|-------|------|--------|
| `totalIphoneUnits` | `number` | Tổng quantity máy iPhone đưa vào báo cáo phía dưới (sau filter `productNameContains` nếu có). |
| `byMarket` | `IphoneMarketTotals` | Tổng theo Lock / Quốc tế / chưa xác định. |
| `byModel` | `IphoneModelBreakdown[]` | Số lượng theo **tên dòng máy** (phần trước dung lượng), có tách Lock/QT/unknown. |
| `byStorage` | `IphoneStorageBreakdown[]` | Tổng theo **dung lượng** (ví dụ `256GB`, `1TB`). |
| `byColor` | `IphoneColorBreakdown[]` | Tổng theo **màu** (phần sau dung lượng trong tên). |
| `detailRows` | `IphoneDetailRow[]` | Bảng chi tiết: model + storage + color + `marketType` + `quantity`. |

```ts
type IphoneMarketKind = 'lock' | 'international' | 'unknown';

interface IphoneMarketTotals {
  lockQuantity: number;              // Nhóm New L / Used L
  internationalQuantity: number;   // Nhóm New Q / Used Q
  unknownMarketQuantity: number;   // Không khớp hoặc thiếu nhóm
}

interface IphoneModelBreakdown {
  modelName: string;
  quantity: number;
  lockQuantity: number;
  internationalQuantity: number;
  unknownMarketQuantity: number;
}

interface IphoneStorageBreakdown {
  storage: string;
  quantity: number;
}

interface IphoneColorBreakdown {
  color: string;
  quantity: number;
}

interface IphoneDetailRow {
  modelName: string;
  storage: string;
  color: string;
  /** Backend trả string; FE có thể coi là union `IphoneMarketKind`. */
  marketType: string;
  /** Nhóm hàng gốc từ KiotViet (`productGroup` hoặc `categoryName`) nếu API có trả. */
  productGroup?: string;
  quantity: number;
}

interface IphoneSalesReport {
  totalIphoneUnits: number;
  byMarket: IphoneMarketTotals;
  byModel: IphoneModelBreakdown[];
  byStorage: IphoneStorageBreakdown[];
  byColor: IphoneColorBreakdown[];
  detailRows: IphoneDetailRow[];
}
```

**Phân loại Lock / Quốc tế (FE chỉ cần biết để hiển thị):**

- **Lock:** chuỗi nhóm chứa pattern **New L** / **Used L** (token `L` sau New/Used), hoặc fallback từ khóa `lock`.
- **Quốc tế:** **New Q** / **Used Q**, hoặc từ khóa `quốc tế` / `quoc te`.

Nếu KiotViet không trả `productGroup` / `categoryName` trên dòng hàng, `marketType` sẽ là `unknown` và số nằm ở `unknownMarketQuantity`.

**Thứ tự mảng (ổn định cho UI):**

- `byModel`: sort theo `modelName` (locale `vi`).
- `byStorage` / `byColor`: sort **giảm dần** theo `quantity`, tie-break theo chuỗi.
- `detailRows`: sort theo `modelName` → `storage` → `color` → `marketType`.

---

## Ví dụ JSON (rút gọn)

```json
{
  "data": [],
  "report": {
    "totalOrders": 42,
    "totalValue": 120000000,
    "accessoryRevenue": 5000000,
    "warrantyRevenue": 3000000,
    "warrantyOrderCount": 10,
    "warrantyQuantity": 12,
    "warrantyBreakdown": [
      {
        "warrantyType": "Bảo Hành CARE⁺ PRO MAX",
        "quantity": 5,
        "revenue": 2500000,
        "orderCount": 4
      }
    ],
    "revenue": 120000000,
    "iphoneReport": {
      "totalIphoneUnits": 30,
      "byMarket": {
        "lockQuantity": 18,
        "internationalQuantity": 10,
        "unknownMarketQuantity": 2
      },
      "byModel": [
        {
          "modelName": "iPhone 16 Pro Max",
          "quantity": 20,
          "lockQuantity": 12,
          "internationalQuantity": 8,
          "unknownMarketQuantity": 0
        }
      ],
      "byStorage": [
        { "storage": "256GB", "quantity": 15 },
        { "storage": "512GB", "quantity": 5 }
      ],
      "byColor": [
        { "color": "Desert Titanium", "quantity": 8 },
        { "color": "Black Titanium", "quantity": 7 }
      ],
      "detailRows": [
        {
          "modelName": "iPhone 16 Pro Max",
          "storage": "256GB",
          "color": "Desert Titanium",
          "marketType": "lock",
          "productGroup": "New L",
          "quantity": 4
        }
      ]
    }
  }
}
```

---

## Lỗi

| HTTP | Tình huống |
|------|------------|
| `400` | Thiếu/sai query (ví dụ `userId` không hợp lệ) — do validator. |
| `500` | KiotViet chưa cấu hình đầy đủ. |
| `503` | Không lấy được token / lỗi gọi KiotViet. |

---

## Gợi ý FE

- Khai báo type `IphoneMarketKind` và narrow `detailRows[].marketType` khi render badge (Lock / QT / —).
- Biểu đồ: dùng `byModel`, `byStorage`, `byColor` hoặc pivot từ `detailRows`.
- Bảng chi tiết: `detailRows` là nguồn “đúng nhất” theo từng cấu hình máy + loại thị trường.
