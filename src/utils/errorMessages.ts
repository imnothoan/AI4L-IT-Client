/**
 * ERROR MESSAGES & USER FEEDBACK SYSTEM
 * Based on industry best practices from Kahoot, Quizizz, ExamSoft, ProctorU
 */

export const ErrorMessages = {
    // ========== AUTHENTICATION ERRORS ==========
    AUTH: {
        USER_NOT_FOUND: {
            title: 'Email không tồn tại',
            message: 'Không tìm thấy tài khoản với email này.',
            suggestion: 'Bạn có muốn tạo tài khoản mới không?',
            actions: [
                { type: 'REGISTER', label: 'Đăng ký ngay', variant: 'primary' },
                { type: 'RETRY', label: 'Thử lại', variant: 'secondary' }
            ],
            tips: [
                'Kiểm tra lại chính tả email',
                'Đảm bảo bạn đang dùng đúng email đã đăng ký'
            ]
        },

        INVALID_PASSWORD: {
            title: 'Mật khẩu không đúng',
            message: (attempts: number) => `Mật khẩu sai. Bạn còn ${attempts} lần thử.`,
            suggestion: 'Quên mật khẩu?',
            actions: [
                { type: 'FORGOT_PASSWORD', label: 'Đặt lại mật khẩu', variant: 'primary' },
                { type: 'RETRY', label: 'Thử lại', variant: 'secondary' }
            ],
            tips: [
                'Kiểm tra Caps Lock',
                'Đảm bảo bạn nhập đúng mật khẩu',
                'Mật khẩu phân biệt chữ hoa/thường'
            ]
        },

        ACCOUNT_LOCKED: {
            title: 'Tài khoản tạm khóa',
            message: (duration: number) => `Tài khoản bị khóa do đăng nhập sai quá nhiều. Vui lòng thử lại sau ${duration} phút.`,
            suggestion: 'Để bảo mật tài khoản, hãy đặt lại mật khẩu.',
            actions: [
                { type: 'FORGOT_PASSWORD', label: 'Đặt lại mật khẩu', variant: 'primary' },
                { type: 'CONTACT_SUPPORT', label: 'Liên hệ hỗ trợ', variant: 'secondary' }
            ],
            tips: [
                'Email thông báo đã được gửi đến hộp thư của bạn',
                'Nếu không phải bạn, hãy liên hệ hỗ trợ ngay'
            ]
        },

        EMAIL_ALREADY_EXISTS: {
            title: 'Email đã được sử dụng',
            message: 'Email này đã có tài khoản trên hệ thống.',
            suggestion: 'Bạn có muốn đăng nhập?',
            actions: [
                { type: 'LOGIN', label: 'Đăng nhập', variant: 'primary' },
                { type: 'FORGOT_PASSWORD', label: 'Quên mật khẩu?', variant: 'secondary' },
                { type: 'USE_DIFFERENT_EMAIL', label: 'Dùng email khác', variant: 'outline' }
            ],
            tips: [
                'Kiểm tra hộp thư spam nếu bạn không nhận được email xác nhận',
                'Có thể bạn đã đăng ký trước đó'
            ]
        },

        WEAK_PASSWORD: {
            title: 'Mật khẩu quá yếu',
            message: 'Mật khẩu không đủ mạnh để bảo vệ tài khoản.',
            suggestion: 'Hãy tạo mật khẩu an toàn hơn.',
            requirements: [
                { met: false, text: 'Ít nhất 8 ký tự' },
                { met: false, text: 'Có chữ hoa' },
                { met: false, text: 'Có chữ thường' },
                { met: false, text: 'Có số' },
                { met: false, text: 'Có ký tự đặc biệt (!@#$%^&*)' }
            ],
            tips: [
                'Dùng cụm từ dễ nhớ nhưng khó đoán',
                'Tránh dùng thông tin cá nhân (tên, ngày sinh)'
            ]
        },

        EMAIL_VERIFICATION_REQUIRED: {
            title: 'Cần xác nhận email',
            message: 'Vui lòng xác nhận email để kích hoạt tài khoản.',
            suggestion: 'Kiểm tra hộp thư của bạn.',
            actions: [
                { type: 'RESEND_EMAIL', label: 'Gửi lại email', variant: 'primary' },
                { type: 'CONTACT_SUPPORT', label: 'Cần trợ giúp?', variant: 'secondary' }
            ],
            tips: [
                'Kiểm tra cả hộp thư spam/junk',
                'Email gửi từ: noreply@intelligencetest.com',
                'Link xác nhận có hiệu lực trong 24h'
            ]
        },

        SESSION_EXPIRED: {
            title: 'Phiên đăng nhập hết hạn',
            message: 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.',
            suggestion: 'Đăng nhập để tiếp tục.',
            actions: [
                { type: 'LOGIN', label: 'Đăng nhập lại', variant: 'primary' }
            ],
            tips: [
                'Dữ liệu của bạn đã được lưu tự động',
                'Hãy chọn "Ghi nhớ đăng nhập" để không bị gián đoạn'
            ]
        }
    },

    // ========== EXAM ERRORS ==========
    EXAM: {
        NOT_FOUND: {
            title: 'Không tìm thấy bài thi',
            message: 'Bài thi này không tồn tại hoặc đã bị xóa.',
            suggestion: 'Vui lòng kiểm tra lại.',
            actions: [
                { type: 'GO_HOME', label: 'Về trang chủ', variant: 'primary' },
                { type: 'CONTACT_INSTRUCTOR', label: 'Liên hệ giảng viên', variant: 'secondary' }
            ]
        },

        NOT_STARTED: {
            title: 'Bài thi chưa mở',
            message: (startTime: string) => `Bài thi sẽ mở vào ${startTime}.`,
            suggestion: 'Vui lòng quay lại đúng giờ.',
            tips: [
                'Bạn sẽ nhận thông báo qua email khi bài thi bắt đầu',
                'Đảm bảo thiết bị và kết nối internet ổn định'
            ]
        },

        ALREADY_COMPLETED: {
            title: 'Đã hoàn thành bài thi',
            message: 'Bạn đã nộp bài thi này.',
            suggestion: 'Xem kết quả hoặc làm bài thi khác.',
            actions: [
                { type: 'VIEW_RESULTS', label: 'Xem kết quả', variant: 'primary' },
                { type: 'EXAM_LIST', label: 'Danh sách bài thi', variant: 'secondary' }
            ]
        },

        TIME_EXPIRED: {
            title: 'Hết thời gian',
            message: 'Thời gian làm bài đã kết thúc.',
            suggestion: 'Bài làm của bạn đã được tự động nộp.',
            tips: [
                'Câu trả lời đã được lưu tự động',
                'Kết quả sẽ có sớm nhất có thể'
            ],
            actions: [
                { type: 'VIEW_ANSWERS', label: 'Xem câu trả lời', variant: 'primary' }
            ]
        },

        ANTICHEAT_WARNING: {
            title: 'Cảnh báo vi phạm',
            message: (violationType: string) => `Phát hiện hành vi: ${violationType}`,
            suggestion: 'Vui lòng tuân thủ quy định thi.',
            warnings: [
                'Tab switch detected',
                'Multiple faces in frame',
                'Phone/book detected',
                'Gaze away from screen',
                'Audio detected'
            ],
            severity: ['low', 'medium', 'high'],
            tips: [
                'Tắt các tab/cửa sổ không cần thiết',
                'Ngồi một mình trong phòng yên tĩnh',
                'Nhìn thẳng vào màn hình',
                'Không sử dụng tài liệu ngoài'
            ]
        },

        CONNECTION_LOST: {
            title: 'Mất kết nối',
            message: 'Không thể kết nối đến server.',
            suggestion: 'Kiểm tra kết nối internet của bạn.',
            actions: [
                { type: 'RETRY', label: 'Thử lại', variant: 'primary' },
                { type: 'SAVE_OFFLINE', label: 'Lưu tạm offline', variant: 'secondary' }
            ],
            tips: [
                'Bài làm được tự động lưu mỗi 30 giây',
                'Dữ liệu sẽ được đồng bộ khi có kết nối',
                'Đảm bảo wifi/4G ổn định'
            ]
        }
    },

    // ========== CLASS ERRORS ==========
    CLASS: {
        STUDENT_ALREADY_IN_CLASS: {
            title: 'Đã tham gia lớp',
            message: 'Sinh viên này đã có trong lớp học.',
            suggestion: 'Không cần thêm lại.',
            actions: [
                { type: 'VIEW_CLASS', label: 'Xem danh sách lớp', variant: 'primary' }
            ]
        },
        NOT_FOUND: {
            title: 'Không tìm thấy lớp học',
            message: 'Lớp học không tồn tại hoặc bạn không có quyền truy cập.',
            actions: [
                { type: 'CLASS_LIST', label: 'Danh sách lớp', variant: 'primary' }
            ]
        }
    },

    // ========== NETWORK ERRORS ==========
    NETWORK: {
        TIMEOUT: {
            title: 'Quá thời gian chờ',
            message: 'Server không phản hồi. Vui lòng thử lại.',
            tips: [
                'Kiểm tra kết nối internet',
                'Thử tải lại trang',
                'Liên hệ hỗ trợ nếu vẫn gặp lỗi'
            ]
        },
        SERVER_ERROR: {
            title: 'Lỗi server',
            message: 'Có lỗi xảy ra trên server. Chúng tôi đang khắc phục.',
            actions: [
                { type: 'RETRY', label: 'Thử lại', variant: 'primary' },
                { type: 'REPORT_BUG', label: 'Báo lỗi', variant: 'secondary' }
            ]
        }
    },

    // ========== VALIDATION ERRORS ==========
    VALIDATION: {
        INVALID_EMAIL: {
            message: 'Email không hợp lệ. Vui lòng kiểm tra lại.',
            example: 'Ví dụ: user@example.com'
        },
        REQUIRED_FIELD: (fieldName: string) => ({
            message: `${fieldName} là bắt buộc.`
        }),
        MIN_LENGTH: (fieldName: string, minLength: number) => ({
            message: `${fieldName} phải có ít nhất ${minLength} ký tự.`
        }),
        MAX_LENGTH: (fieldName: string, maxLength: number) => ({
            message: `${fieldName} không được vượt quá ${maxLength} ký tự.`
        })
    }
};

// Helper function to get error message
export function getErrorMessage(errorCode: string, data?: any): any {
    const path = errorCode.split('.');
    let message: any = ErrorMessages;

    for (const key of path) {
        message = message?.[key];
        if (!message) break;
    }

    if (typeof message === 'function') {
        return message(data);
    }

    return message || {
        title: 'Có lỗi xảy ra',
        message: 'Vui lòng thử lại sau.',
        actions: [{ type: 'RETRY', label: 'Thử lại', variant: 'primary' }]
    };
}
