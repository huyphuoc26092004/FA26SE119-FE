# API BE còn thiếu cho FE

Cập nhật 19/11/2026 (nhánh `fix/remove-mock-data`). FE không còn dữ liệu giả cho các mục dưới đây. Khi BE chưa có API, FE hiện trạng thái rỗng hoặc dấu "—" thay vì số bịa.

| Chức năng FE | Hiện FE làm gì | API BE cần có |
| --- | --- | --- |
| Danh sách việc đã ứng tuyển (`getAppliedJobRows`) | Trả danh sách rỗng. BE có ghi sự kiện qua `POST /jobs/{id}/external-apply` nhưng chưa cho đọc lại. | `GET /api/v1/applied-jobs` (việc đã ứng tuyển của ứng viên, mới nhất trước) |
| Lịch sử phản hồi gợi ý AI (`getRecommendationFeedbackList`, `getFeedbackForTarget`) | Trả rỗng. Ứng viên vẫn gửi được phản hồi qua `PUT /matching/results/{id}/feedback`. | `GET /api/v1/matching/feedback` (phản hồi của chính ứng viên), hoặc trả `feedback` kèm từng kết quả matching |
| Tag của phản hồi matching | Tag được ghép vào đầu bình luận. | Trường `tags` trong body của `PUT /matching/results/{id}/feedback` |
| Hạ tầng trên dashboard admin (CPU, RAM, ổ đĩa, uptime) | Ẩn dòng uptime; các ô tài nguyên để 0. | Một endpoint health/metrics, ví dụ `GET /api/v1/admin/monitoring/system` (Spring Actuator) |
| Điểm ATS chi tiết khi tải CV lên (định dạng, từ khoá, số liệu) | Đã bỏ 3 dòng điểm giả; chỉ hiện điểm ATS tổng nếu BE trả về. | Trả breakdown ATS trong kết quả phân tích CV |
| Điểm ATS, điểm mạnh của CV mẫu cho khách | Đã bỏ điểm giả; tab CV mẫu dùng `GET /guest/demo-resumes` và gợi ý việc từ `POST /guest/trials/recommendations`. | (Tuỳ chọn) điểm ATS đã chấm sẵn cho CV mẫu |
| Độ khớp của việc làm công khai cho khách | Đã bỏ cột "% khớp" giả ở tab Duyệt việc làm. Độ khớp thật nằm ở tab CV mẫu. | Không cần thêm |

## Đã chuyển từ dữ liệu giả sang API thật

- Tab CV mẫu cho khách: `GET /guest/demo-resumes`, `POST /guest/trials/recommendations`.
- Resume Builder cho khách: `GET /guest/templates`. Nếu lỗi mạng thì vẫn dùng mẫu dựng sẵn trong FE.
- Trang chủ: khung "Việc làm mới nhất" lấy từ `GET /jobs` (trước đây là 3 việc làm bịa có điểm khớp).
- Dashboard, hồ sơ ứng viên, trang tải CV, danh sách ứng viên của tư vấn viên: chỉ hiện số thật (ATS, số việc gợi ý, độ khớp TB), không còn giá trị mặc định 88/92/85/24/88%.

## Lưu ý dữ liệu local

- DB local chỉ có 1 CV mẫu (`resumes.is_demo = true`). Muốn tab CV mẫu có nhiều lựa chọn hơn thì thêm CV mẫu ở BE.
- Tài khoản ứng viên chưa có CV sẽ thấy lỗi ở mục "Việc làm gợi ý" trên dashboard. Lỗi này đã có từ trước, không phải do thay đổi lần này.
