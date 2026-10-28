# CCV mobile (Flutter)

App cho **ứng viên**, gọi thẳng backend `Intelligent-CV-Matching-AI-Agent-BE` qua REST `/api/v1` (JWT: access 15 phút, refresh 30 ngày, tự làm mới khi gặp 401). Tài khoản cố vấn và quản trị dùng bản web.

## Màn hình

| Tab | Nội dung | API |
| --- | --- | --- |
| Đăng nhập / Đăng ký | Email + mật khẩu, đăng ký có mã OTP | `/auth/login`, `/auth/register`, `/auth/verify-email`, `/me` |
| Trang chủ | Lời chào, số CV, việc phù hợp, chạy so khớp | `/me/career-profile`, `/resumes`, `/matching` |
| Việc làm | Tìm kiếm, lọc Phù hợp / Đã lưu / Đã ứng tuyển, chi tiết, ứng tuyển qua link gốc | `/jobs`, `/jobs/{id}`, `/jobs/{id}/external-apply` |
| CV | Tải lên PDF/DOCX, xác nhận, phân tích, đặt CV chính, xoá | `/resumes/**` |
| Tư vấn | Gửi yêu cầu, nhắn tin với cố vấn, đóng yêu cầu | `/consultations/**` |
| Tài khoản | Hồ sơ, token AI còn lại, ngôn ngữ, đăng xuất | `/subscriptions/me` |

"Đã lưu" chưa có API backend nên được lưu trên máy.

## Chạy

```bash
cd mobile
flutter pub get
flutter run                     # chọn máy ảo Android / iPhone simulator / Chrome
```

Địa chỉ backend mặc định: máy ảo Android `http://10.0.2.2:8080/api/v1`, iOS simulator và web `http://localhost:8080/api/v1`.
Điện thoại thật cần IP của Mac trong cùng Wi-Fi:

```bash
flutter run --dart-define=API_BASE_URL=http://192.168.1.10:8080/api/v1
```

Chạy trên Chrome: backend chỉ cho phép CORS từ `localhost:3000` và `localhost:5173` (`CORS_ALLOWED_ORIGINS` trong `.env`), nên chạy `flutter run -d chrome --web-port 3000` hoặc thêm cổng khác vào biến đó. App Android/iOS không bị CORS.

## Build APK

```bash
flutter build apk --release --dart-define=API_BASE_URL=http://192.168.1.10:8080/api/v1
# → build/app/outputs/flutter-apk/app-release.apk
```

GitHub Actions: workflow **Flutter APK** chạy khi push lên `main` có thay đổi trong `mobile/`, hoặc bấm *Run workflow* và nhập `api_base_url`.

## Cấu trúc

```
lib/
  core/        config (API URL), theme (màu CCV), api_client (Dio + JWT refresh), json helpers, i18n vi/en
  data/        models (đọc JSON snake_case của backend), repository + providers (Riverpod)
  features/    auth, home, jobs, resumes, consultations, account
  widgets/     kit.dart: Card, BigButton, Pill, Tag, ScoreRing, ThinBar, ListGroup…
  app.dart     go_router + thanh tab dưới
```
