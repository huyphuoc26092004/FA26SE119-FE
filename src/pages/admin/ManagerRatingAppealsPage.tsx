import { ManagerHead } from '../../components/manager/ManagerUi';
import { ManagerRatingAppeals } from '../../components/consultation/RatingAppeals';

/** /manager/rating-appeals — Manager đọc đề xuất và lý do của Staff rồi chấp thuận hay không. */
export default function ManagerRatingAppealsPage() {
  return (
    <main className="space-y-8 pb-10">
      <ManagerHead
        crumbs={['Quản lý', 'Duyệt báo cáo đánh giá']}
        title="Phê duyệt báo cáo đánh giá"
        intro="Staff đã xem bằng chứng và đề xuất ẩn hoặc giữ từng đánh giá. Đọc lý do của Staff, ghi lý do của bạn rồi chấp thuận hay không. Chỉ khi đánh giá bị ẩn thì điểm trung bình của tư vấn viên mới được tính lại."
      />
      <ManagerRatingAppeals heading={false} />
    </main>
  );
}
