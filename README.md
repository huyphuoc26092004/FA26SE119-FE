# CCV Web — FA26SE119

Frontend React của **Intelligent CV Matching AI Agent** (CCV). Web gọi thẳng backend [`Intelligent-CV-Matching-AI-Agent-BE`](https://github.com/Quangtr04/Intelligent-CV-Matching-AI-Agent-BE) qua REST `/api/v1`, đăng nhập bằng JWT. Không còn dữ liệu giả (mock).

Có 3 vai trò: **Ứng viên**, **Cố vấn** và **Quản trị**. Ngoài web còn có app mobile Flutter dành cho ứng viên, nằm trong thư mục [`mobile/`](mobile/README.md).

## Yêu cầu
- Node.js >= 20.19 (khuyên dùng Node 22 LTS), npm 10+
- Backend đang chạy ở `http://localhost:8080` (xem README của repo BE)

## Chạy

```bash
cp .env.example .env.development   # VITE_API_BASE_URL=http://localhost:8080/api/v1
npm ci
npm run dev                        # http://localhost:5173
```

Trước khi mở pull request:

```bash
npm run lint
npm run build
```

## Tài khoản

Backend không tạo sẵn tài khoản mẫu.

- **Ứng viên:** đăng ký trên web. Mã OTP được gửi qua SMTP cấu hình trong `.env` của BE. Nếu đặt `AUTH_EXPOSE_DEV_OTP=true`, mã OTP được trả thẳng trong response.
- **Quản trị / Cố vấn:** đặt `BOOTSTRAP_ADMIN_*` và `BOOTSTRAP_CONSULTANT_*` trong `.env` của BE, hoặc đăng ký thường rồi đổi `role` trong bảng `users`.

## Cấu trúc
- `src/app`: router, providers, query client
- `src/layouts`: khung trang public và khung theo vai trò
- `src/components`: thành phần giao diện dùng chung
- `src/pages`: màn hình theo vai trò (`candidate`, `consultant`, `admin`, `shared`, `public` gồm cả dùng thử cho khách, `errors`)
- `src/services`: lớp gọi API (Axios `apiClient`). `candidateMappers.ts` chuyển dữ liệu snake_case của BE sang kiểu của FE. Chức năng nào BE chưa có API thì được đánh dấu `TODO(api)` trong `apiPending.ts`.
- `src/stores`: trạng thái đăng nhập (access/refresh token, tự làm mới khi gặp 401)
- `src/types`, `src/constants`, `src/i18n`, `src/utils`
- `mobile/`: app Flutter cho ứng viên

## Quy trình nhóm
- Giữ `main` ổn định. Mỗi tính năng làm trên nhánh `feature/<tên>` hoặc `fix/<tên>`, rồi mở PR vào `main`. CI chạy lint và build.
- Không commit secret, `.env*` (trừ `.env.example`) hay `node_modules`.
- Stage bằng `git add -u` hoặc đường dẫn cụ thể. Không dùng `git add .`, vì repo nằm trong iCloud có thể sinh file trùng `* 2.*`.
- Khi deploy, cấu hình SPA fallback về `index.html` để React Router mở được link sâu.
