# BK-PARKING Smart Solution

BK-PARKING Smart Solution là hệ thống quản lý bãi đỗ xe thông minh dành cho khuôn viên trường đại học. Hệ thống hỗ trợ quản lý bản đồ bãi xe, xử lý xe vào/ra, thanh toán phí gửi xe, báo cáo sự cố, vận hành cổng, giám sát thiết bị IoT, cấu hình hệ thống và báo cáo phân tích.

## 1. Mục tiêu hệ thống

Hệ thống được xây dựng nhằm mô phỏng quy trình vận hành bãi xe thông minh trong môi trường trường đại học, bao gồm:

- Định danh người dùng nội bộ bằng tài khoản hệ thống.
- Tra cứu tình trạng bãi đỗ và chỉ đường đến ô trống.
- Xử lý xe vào, xe ra cho người dùng nội bộ và khách vãng lai.
- Thanh toán phí gửi xe qua BKPay.
- Báo cáo và tiếp nhận sự cố tại bãi xe.
- Quản lý phân quyền, chính sách giá và cấu hình bãi đỗ.
- Giám sát trạng thái thiết bị IoT và cảnh báo vận hành.
- Báo cáo, phân tích và đối soát giao dịch BKPay.

## 2. Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Styling | Tailwind CSS |
| Icon | lucide-react |
| Backend mock | Express.js |
| Lưu trạng thái demo | localStorage, mock API |
| Package manager | pnpm |

## 3. Cấu trúc thư mục chính

```txt
.
├── app/
│   ├── page.tsx                    # Trang đăng nhập
│   ├── map/page.tsx                # UC3 - Bản đồ bãi xe
│   ├── xe-vao/page.tsx             # UC1 - Xử lý xe vào
│   ├── xe-ra/page.tsx              # UC1 - Xử lý xe ra
│   ├── dashboard/page.tsx          # UC2 - Tổng quan tài khoản
│   ├── payment/page.tsx            # UC2 - Thanh toán phí gửi xe
│   ├── history/page.tsx            # UC2 - Lịch sử giao dịch
│   ├── support/report/page.tsx     # UC4 - Báo cáo sự cố
│   ├── support/tickets/page.tsx    # UC4 - Tiếp nhận sự cố
│   ├── gate-ops/page.tsx           # UC5 - Vận hành cổng
│   ├── admin/dashboard/page.tsx    # UC5.4 - Giám sát thiết bị IoT
│   ├── admin/settings/page.tsx     # UC6 - Cấu hình hệ thống
│   └── reports/page.tsx            # UC7 - Báo cáo và phân tích
│
├── components/
│   ├── parking/                    # Header, camera, xử lý thẻ, UI bãi xe
│   └── gate-ops/                   # Component vận hành cổng
│
├── lib/
│   └── parking-data.ts             # Mock data dùng chung cho map, UC2, UC5, UC6, UC7
│
├── public/
│   └── bk-logo.png                 # Logo BK dùng cho trang đăng nhập
│
└── server/
    └── index.js                    # Backend mock API Express
```

## 4. Các chức năng đã tích hợp

### UC1 - Xử lý xe vào / xe ra

| Route | Mô tả | Role chính |
|---|---|---|
| `/xe-vao` | Xử lý xe vào, quét thẻ, nhận diện biển số, tạo phiên gửi xe | Vận hành |
| `/xe-ra` | Xử lý xe ra, đối chiếu biển số, tính phí, đóng phiên gửi xe | Vận hành |

### UC2 - Thanh toán và lịch sử giao dịch

| Route | Mô tả | Role chính |
|---|---|---|
| `/dashboard` | Xem tổng quan tài khoản, dư nợ và số dư | Sinh viên / Người dùng nội bộ |
| `/payment` | Thanh toán phí gửi xe qua BKPay | Sinh viên / Người dùng nội bộ |
| `/history` | Tra cứu lịch sử giao dịch và xuất biên lai | Sinh viên / Người dùng nội bộ |

### UC3 - Tra cứu tình trạng và định vị bãi đỗ

| Route | Mô tả | Role chính |
|---|---|---|
| `/map` | Xem bản đồ bãi xe, chọn khu vực, chọn ô trống và chỉ đường | Sinh viên, Giảng viên/Cán bộ |

Ghi chú:

- Sinh viên và Giảng viên/Cán bộ được chọn ô trống và chỉ đường.
- Ban quản lý và Vận hành có thể xem tình trạng bãi đỗ.
- IT không phải tác nhân chính của UC3.

### UC4 - Báo cáo sự cố thực địa

| Route | Mô tả | Role chính |
|---|---|---|
| `/support/report` | Gửi báo cáo sự cố, nhập mô tả, tải ảnh minh chứng, SOS khẩn cấp | Sinh viên, Giảng viên/Cán bộ |
| `/support/tickets` | Tiếp nhận, lọc và cập nhật trạng thái ticket sự cố | Vận hành |

### UC5 - Vận hành cổng và xử lý ngoại lệ

| Route | Mô tả | Role chính |
|---|---|---|
| `/gate-ops` | Xử lý mất thẻ, hỏng thẻ, cảnh báo an ninh và mở barrier khẩn cấp | Vận hành |

### UC5.4 - Giám sát trạng thái thiết bị

| Route | Mô tả | Role chính |
|---|---|---|
| `/admin/dashboard` | Theo dõi trạng thái cảm biến, gateway, bảng LED và cảnh báo IoT | Vận hành |

### UC6 - Cấu hình hệ thống

| Route | Tab | Role được chỉnh |
|---|---|---|
| `/admin/settings` | Quản lý chính sách | Ban quản lý |
| `/admin/settings` | Quản lý phân quyền | IT |
| `/admin/settings` | Quản lý bãi đỗ | Vận hành |

### UC7 - Báo cáo và phân tích

| Route | Mô tả | Role chính |
|---|---|---|
| `/reports` | Xem heatmap lấp đầy, đối soát BKPay, xuất PDF/Excel | Ban quản lý |

## 5. Tài khoản demo

| Username | Password | Role | Mục đích test |
|---|---|---|---|
| `2410297` | `123` | Ban quản lý | Chính sách giá, báo cáo UC7, xem map |
| `it01` | `123` | IT | Quản lý phân quyền UC6 |
| `bv01` | `123` | Vận hành | UC1, UC4 tickets, UC5, UC5.4, cấu hình bãi đỗ |
| `sv01` | `123` | Sinh viên | UC2, UC3, UC4 report |
| `gvcb01` | `123` | Giảng viên/Cán bộ | UC3, UC4 report |

## 6. Hướng dẫn cài đặt và chạy project

### Bước 1: Cài dependencies

```bash
pnpm install
```

### Bước 2: Chạy backend mock API

Mở terminal thứ nhất:

```bash
node server/index.js
```

Backend chạy tại:

```txt
http://localhost:3001
```

### Bước 3: Chạy frontend

Mở terminal thứ hai:

```bash
pnpm dev
```

Frontend chạy tại:

```txt
http://localhost:3000
```

### Bước 4: Đăng nhập hệ thống

Truy cập:

```txt
http://localhost:3000
```

Sau đó đăng nhập bằng một trong các tài khoản demo ở trên.

## 7. Lưu ý khi test

Nếu hệ thống hiển thị sai role, sai dữ liệu map hoặc vẫn giữ trạng thái cũ, hãy xóa localStorage trong trình duyệt:

```txt
DevTools → Application → Local Storage → Clear
```

Hoặc xóa riêng key:

```txt
bk_parking_zones_v1
```

Sau đó đăng xuất và đăng nhập lại.

## 8. Dữ liệu và API mock

Backend hiện dùng dữ liệu mock trong `server/index.js`, bao gồm:

- Danh sách tài khoản và role.
- API đăng nhập.
- API khu vực bãi đỗ và ô đỗ.
- API check-in/check-out xe.
- API báo cáo, heatmap và đối soát BKPay.

Một số trạng thái thao tác trong demo được lưu bằng `localStorage`, ví dụ trạng thái bãi đỗ, ticket sự cố hoặc phiên xử lý tạm thời.

## 9. Các route quan trọng

```txt
/                     Trang đăng nhập
/map                  Bản đồ bãi xe
/xe-vao               Xử lý xe vào
/xe-ra                Xử lý xe ra
/dashboard            Tổng quan tài khoản
/payment              Thanh toán BKPay
/history              Lịch sử giao dịch
/support/report       Báo cáo sự cố
/support/tickets      Tiếp nhận sự cố
/gate-ops             Vận hành cổng
/admin/dashboard      Giám sát thiết bị IoT
/admin/settings       Cấu hình hệ thống
/reports              Báo cáo và phân tích
```

## 10. Trạng thái hoàn thiện

Hệ thống hiện đã tích hợp các use case chính:

- UC1: Xử lý xe vào / xe ra.
- UC2: Thanh toán và lịch sử giao dịch.
- UC3: Bản đồ bãi xe và chỉ đường.
- UC4: Báo cáo sự cố.
- UC5: Vận hành cổng và xử lý ngoại lệ.
- UC5.4: Giám sát trạng thái thiết bị.
- UC6: Cấu hình hệ thống.
- UC7: Báo cáo và phân tích.

## 11. Hạn chế hiện tại

- Dữ liệu chủ yếu là mock data, chưa kết nối cơ sở dữ liệu thật.
- Các thao tác thanh toán, đối soát và cảnh báo IoT đang mô phỏng.
- Một số trạng thái chỉ được lưu ở localStorage nên có thể mất khi clear trình duyệt.
- Chưa triển khai xác thực SSO thật.
- Chưa triển khai phân quyền backend ở mức production.

## 12. Hướng phát triển

- Kết nối cơ sở dữ liệu thật cho người dùng, phiên gửi xe, ticket và giao dịch.
- Tích hợp HCMUT_SSO và HCMUT_DATACORE.
- Tích hợp cảm biến IoT thật cho từng ô đỗ.
- Tích hợp BKPay thật thay vì mock payment.
- Bổ sung audit log cho các thao tác vận hành và quản trị.
- Hoàn thiện dashboard phân tích theo thời gian thực.

