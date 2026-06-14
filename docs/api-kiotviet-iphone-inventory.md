# API: Tồn kho iPhone theo chi nhánh (`GET /kiotviet/inventory/iphone`)

Tài liệu cho FE hiển thị **số lượng tồn (onHand)** của từng loại iPhone, **chia theo chi nhánh**.

Nguồn dữ liệu: `GET /products?includeInventory=true` (KiotViet, phân trang). Đây là tồn **tại thời điểm gọi API** (realtime), không liên quan tới khoảng thời gian hóa đơn.

Base URL thực tế phụ thuộc môi trường triển khai (ví dụ `https://{host}/kiotviet/inventory/iphone`).

---

## Request

Không có tham số.

```http
GET /kiotviet/inventory/iphone
```

---

## Response (200)

```ts
interface IphoneInventoryReport {
  totalOnHand: number;
  byBranch: IphoneInventoryBranch[];
}

interface IphoneInventoryBranch {
  branchId: number;
  branchName: string;
  totalOnHand: number;                 // tổng tồn iPhone của chi nhánh
  byMarket: IphoneMarketTotals;        // tách Lock / Quốc tế / chưa xác định (theo onHand)
  detailRows: IphoneInventoryDetailRow[];
}

type IphoneMarketKind = 'lock' | 'international' | 'unknown';

interface IphoneMarketTotals {
  lockQuantity: number;              // Nhóm New L / Used L
  internationalQuantity: number;     // Nhóm New Q / Used Q
  unknownMarketQuantity: number;     // Không khớp hoặc thiếu nhóm
}

interface IphoneInventoryDetailRow {
  modelName: string;
  storage: string;
  color: string;
  /** Backend trả string; FE có thể coi là union `IphoneMarketKind`. */
  marketType: string;
  /** Nhóm hàng gốc từ KiotViet (`categoryName`) nếu có. */
  productGroup?: string;
  onHand: number;                      // số lượng tồn
}
```

| Field | Kiểu | Ý nghĩa |
|-------|------|--------|
| `totalOnHand` | `number` | Tổng tồn iPhone của **tất cả** chi nhánh. |
| `byBranch` | `IphoneInventoryBranch[]` | Tồn chia theo từng chi nhánh. |

### Cách dựng dữ liệu

Mỗi sản phẩm iPhone được:

- parse tên (`fullName` → fallback `name`) theo mẫu **`iPhone … {dung lượng} … {màu}`**
  Ví dụ: `iPhone 16 Pro Max 256GB Desert Titanium` → model `iPhone 16 Pro Max`, `256GB`, `Desert Titanium`.
- phân loại Lock / Quốc tế từ `categoryName`.

**Phân loại Lock / Quốc tế:**

- **Lock:** nhóm chứa pattern **New L** / **Used L** (token `L` sau New/Used), hoặc fallback từ khóa `lock`.
- **Quốc tế:** **New Q** / **Used Q**, hoặc từ khóa `quốc tế` / `quoc te`.
- Không xác định được → `marketType = 'unknown'`, số nằm ở `unknownMarketQuantity`.

**Lưu ý:**

- Số liệu là **`onHand`** (tồn), không phải số bán.
- Sản phẩm có `onHand <= 0` bị bỏ qua; chi nhánh không có tồn iPhone sẽ **không** xuất hiện trong `byBranch`.

**Thứ tự mảng (ổn định cho UI):**

- `byBranch`: sort theo `branchName` (locale `vi`).
- `detailRows`: sort theo `modelName` → `storage` → `color` → `marketType`.

---

## Ví dụ JSON (rút gọn)

```json
{
  "totalOnHand": 25,
  "byBranch": [
    {
      "branchId": 1,
      "branchName": "Chi nhánh Quận 1",
      "totalOnHand": 15,
      "byMarket": {
        "lockQuantity": 9,
        "internationalQuantity": 6,
        "unknownMarketQuantity": 0
      },
      "detailRows": [
        {
          "modelName": "iPhone 16 Pro Max",
          "storage": "256GB",
          "color": "Desert Titanium",
          "marketType": "lock",
          "productGroup": "New L",
          "onHand": 5
        }
      ]
    },
    {
      "branchId": 2,
      "branchName": "Chi nhánh Quận 5",
      "totalOnHand": 10,
      "byMarket": {
        "lockQuantity": 4,
        "internationalQuantity": 6,
        "unknownMarketQuantity": 0
      },
      "detailRows": [
        {
          "modelName": "iPhone 16 Pro Max",
          "storage": "512GB",
          "color": "Black Titanium",
          "marketType": "international",
          "productGroup": "New Q",
          "onHand": 3
        }
      ]
    }
  ]
}
```

---

## Lỗi

| HTTP | Tình huống |
|------|------------|
| `500` | KiotViet chưa cấu hình đầy đủ, hoặc lỗi khi lấy báo cáo tồn kho. |
| `503` | Không lấy được token KiotViet. |

---

## Gợi ý FE

- Render tab/cột theo chi nhánh từ `byBranch`; `totalOnHand` cho số tổng toàn hệ thống.
- Badge Lock / QT / — dựa trên `detailRows[].marketType` (narrow về `IphoneMarketKind`).
- Bảng chi tiết: `detailRows` là nguồn “đúng nhất” theo từng cấu hình máy + loại thị trường, trong từng chi nhánh.
