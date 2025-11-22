import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowLeft } from 'lucide-react';

const UserGuide: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <BookOpen className="w-8 h-8 text-blue-600" />
                            <h1 className="text-2xl font-bold text-gray-900">Hướng Dẫn Sử Dụng</h1>
                        </div>
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Quay lại
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
                    {/* For Students */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Dành cho Sinh viên</h2>
                        <div className="space-y-4 text-gray-700">
                            <div>
                                <h3 className="font-semibold text-lg mb-2">1. Đăng ký tài khoản</h3>
                                <p className="mb-2">Nhấn vào nút "Đăng ký" trên trang đăng nhập và điền thông tin:</p>
                                <ul className="list-disc list-inside ml-4 space-y-1">
                                    <li>Email</li>
                                    <li>Mật khẩu</li>
                                    <li>Họ và tên</li>
                                    <li>Chọn vai trò "Sinh viên"</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-semibold text-lg mb-2">2. Tham gia lớp học</h3>
                                <p>Liên hệ với giảng viên để được thêm vào lớp học. Sau khi được thêm, bạn sẽ thấy lớp học trong phần "Lớp Học Của Tôi".</p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-lg mb-2">3. Làm bài thi</h3>
                                <p className="mb-2">Khi có bài thi mới:</p>
                                <ul className="list-disc list-inside ml-4 space-y-1">
                                    <li>Nhấn "Bắt Đầu Làm Bài"</li>
                                    <li>Đọc kỹ hướng dẫn</li>
                                    <li>Cho phép truy cập camera nếu bài thi có giám sát</li>
                                    <li>Làm bài trong thời gian quy định</li>
                                    <li>Nhấn "Nộp Bài" khi hoàn thành</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-semibold text-lg mb-2">4. Xem kết quả</h3>
                                <p>Sau khi nộp bài, bạn có thể xem điểm và kết quả chi tiết trong phần "Kết Quả Gần Đây".</p>
                            </div>
                        </div>
                    </section>

                    <hr className="my-8" />

                    {/* For Instructors */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Dành cho Giảng viên</h2>
                        <div className="space-y-4 text-gray-700">
                            <div>
                                <h3 className="font-semibold text-lg mb-2">1. Tạo lớp học</h3>
                                <p className="mb-2">Từ Dashboard, nhấn "Tạo Lớp Học" và điền:</p>
                                <ul className="list-disc list-inside ml-4 space-y-1">
                                    <li>Tên lớp học</li>
                                    <li>Mô tả</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-semibold text-lg mb-2">2. Quản lý sinh viên</h3>
                                <p>Nhấn vào lớp học để xem chi tiết, sau đó thêm sinh viên bằng email của họ.</p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-lg mb-2">3. Tạo đề thi</h3>
                                <p className="mb-2">Nhấn "Tạo Đề Thi" và:</p>
                                <ul className="list-disc list-inside ml-4 space-y-1">
                                    <li>Nhập thông tin cơ bản (tiêu đề, thời gian, lớp học)</li>
                                    <li>Thêm câu hỏi thủ công HOẶC dùng AI để tạo tự động</li>
                                    <li>Bật/tắt tính năng CAT (Thích ứng) và Anti-cheat (Chống gian lận)</li>
                                    <li>Lưu đề thi</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-semibold text-lg mb-2">4. Giám sát bài thi</h3>
                                <p>Truy cập "Monitoring" để theo dõi sinh viên đang làm bài trong thời gian thực.</p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-lg mb-2">5. Xem phân tích</h3>
                                <p>Truy cập "Analytics" để xem thống kê về hiệu suất sinh viên, độ khó câu hỏi, và các chỉ số khác.</p>
                            </div>
                        </div>
                    </section>

                    <hr className="my-8" />

                    {/* Technical Features */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Tính năng nâng cao</h2>
                        <div className="space-y-4 text-gray-700">
                            <div>
                                <h3 className="font-semibold text-lg mb-2">CAT (Computerized Adaptive Testing)</h3>
                                <p>Bài thi thích ứng tự động điều chỉnh độ khó câu hỏi dựa trên khả năng của sinh viên, giúp đánh giá chính xác hơn với ít câu hỏi hơn.</p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-lg mb-2">Anti-cheat (Chống gian lận)</h3>
                                <p className="mb-2">Hệ thống giám sát qua camera để phát hiện hành vi gian lận:</p>
                                <ul className="list-disc list-inside ml-4 space-y-1">
                                    <li>Phát hiện khi nhìn ra ngoài màn hình</li>
                                    <li>Phát hiện nhiều người trong khung hình</li>
                                    <li>Cảnh báo khi chuyển tab hoặc tắt màn hình</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-semibold text-lg mb-2">AI Question Generation</h3>
                                <p>Giảng viên có thể tạo câu hỏi tự động bằng AI, chỉ cần nhập chủ đề, số lượng, và độ khó.</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default UserGuide;
