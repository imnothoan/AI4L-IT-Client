import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '@/store';
import {
    BookOpenIcon,
    GraduationCapIcon,
    UserIcon,
    SettingsIcon,
    ArrowRightIcon,
    CheckCircleIcon,
    ClockIcon,
    UsersIcon
} from '@/components/icons/AcademicIcons';

interface MainLayoutProps {
    children: React.ReactNode;
    rightSidebar?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, rightSidebar }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser, logout } = useStore();

    const isActive = (path: string) => location.pathname === path;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = currentUser?.role === 'student' ? [
        { icon: BookOpenIcon, label: 'Bảng tin', path: '/student' },
        { icon: ClockIcon, label: 'Bài thi của tôi', path: '/student/exams' },
        { icon: UsersIcon, label: 'Lớp học', path: '/student/classes' },
        { icon: CheckCircleIcon, label: 'Kết quả', path: '/student/results' },
    ] : [
        { icon: BookOpenIcon, label: 'Tổng quan', path: '/instructor' },
        { icon: ClockIcon, label: 'Quản lý bài thi', path: '/instructor/exams' },
        { icon: UsersIcon, label: 'Quản lý lớp học', path: '/instructor/classes' },
        { icon: CheckCircleIcon, label: 'Ngân hàng câu hỏi', path: '/instructor/question-bank' },
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Top Navigation Bar */}
            <header className="bg-white shadow-sm sticky top-0 z-50 h-14 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-2xl">
                        IT
                    </div>
                    <div className="hidden md:flex relative ml-2">
                        <input
                            type="text"
                            placeholder="Tìm kiếm trên Intelligence Test"
                            className="bg-[#F0F2F5] rounded-full px-4 py-2 pl-9 w-64 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <svg className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {/* Center Nav (Desktop) */}
                <div className="hidden md:flex items-center gap-1 h-full">
                    {menuItems.slice(0, 4).map((item) => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`h-[90%] px-8 rounded-lg flex items-center justify-center relative group ${isActive(item.path) ? 'text-primary' : 'text-gray-500 hover:bg-gray-100'
                                }`}
                        >
                            <item.icon size={28} className={isActive(item.path) ? 'fill-current' : ''} />
                            {isActive(item.path) && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-md"></div>
                            )}
                            <div className="absolute opacity-0 group-hover:opacity-100 bg-black/80 text-white text-xs px-2 py-1 rounded bottom-[-30px] transition-opacity whitespace-nowrap pointer-events-none">
                                {item.label}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-300 transition">
                        <SettingsIcon size={20} className="text-black" />
                    </div>
                    <div className="relative group">
                        <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden cursor-pointer border border-gray-300">
                            <UserIcon size={40} className="text-gray-400 mt-1" />
                        </div>

                        {/* Dropdown Menu */}
                        <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-floating p-2 hidden group-hover:block">
                            <div className="p-2 hover:bg-gray-100 rounded-lg flex items-center gap-3 cursor-pointer mb-2">
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                    <UserIcon size={24} className="text-gray-500" />
                                </div>
                                <div>
                                    <p className="font-semibold text-text-primary">{currentUser?.name}</p>
                                    <p className="text-sm text-text-secondary">Xem trang cá nhân của bạn</p>
                                </div>
                            </div>
                            <div className="border-t border-divider my-1"></div>
                            <button
                                onClick={handleLogout}
                                className="w-full text-left p-2 hover:bg-gray-100 rounded-lg flex items-center gap-3 font-medium text-text-primary"
                            >
                                <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center">
                                    <ArrowRightIcon size={20} />
                                </div>
                                Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Grid */}
            <div className="flex-1 flex max-w-[1920px] mx-auto w-full">
                {/* Left Sidebar (Fixed) */}
                <aside className="hidden lg:block w-[360px] sticky top-14 h-[calc(100vh-56px)] overflow-y-auto p-4 hover:overflow-y-scroll custom-scrollbar">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 p-2 hover:bg-gray-200 rounded-lg cursor-pointer transition">
                            <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                <UserIcon size={20} />
                            </div>
                            <span className="font-semibold text-text-primary">{currentUser?.name}</span>
                        </div>

                        {menuItems.map((item) => (
                            <div
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className="flex items-center gap-3 p-2 hover:bg-gray-200 rounded-lg cursor-pointer transition"
                            >
                                <item.icon size={36} className="text-primary" />
                                <span className="font-medium text-text-primary">{item.label}</span>
                            </div>
                        ))}

                        <div className="border-t border-divider my-2"></div>

                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-text-secondary font-semibold text-lg">Lối tắt của bạn</h3>
                            <button className="text-primary text-sm hover:bg-gray-200 px-2 py-1 rounded">Chỉnh sửa</button>
                        </div>

                        {/* Simulated Shortcuts */}
                        <div className="flex items-center gap-3 p-2 hover:bg-gray-200 rounded-lg cursor-pointer transition">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                                <GraduationCapIcon size={20} />
                            </div>
                            <span className="font-medium text-text-primary">Nhóm Học Tập K24</span>
                        </div>
                    </div>
                </aside>

                {/* Center Feed */}
                <main className="flex-1 min-w-0 flex justify-center p-4 md:p-8">
                    <div className="w-full max-w-[680px] space-y-5">
                        {children}
                    </div>
                </main>

                {/* Right Sidebar (Fixed) */}
                <aside className="hidden xl:block w-[360px] sticky top-14 h-[calc(100vh-56px)] overflow-y-auto p-4">
                    {rightSidebar || (
                        <>
                            <h3 className="text-text-secondary font-semibold text-lg mb-4 px-2">Được tài trợ</h3>
                            {/* Sponsored Content Placeholder */}
                            <div className="flex items-center gap-3 p-2 hover:bg-gray-200 rounded-lg cursor-pointer transition mb-4">
                                <div className="w-32 h-32 bg-gray-300 rounded-lg flex-shrink-0"></div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-text-primary">Khóa học AI Master</span>
                                    <span className="text-sm text-text-secondary">hocvienai.com</span>
                                </div>
                            </div>

                            <div className="border-t border-divider my-2"></div>

                            <h3 className="text-text-secondary font-semibold text-lg mb-2 px-2">Người liên hệ</h3>
                            {/* Online Users Placeholder */}
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center gap-3 p-2 hover:bg-gray-200 rounded-lg cursor-pointer transition">
                                    <div className="relative">
                                        <div className="w-9 h-9 bg-gray-300 rounded-full"></div>
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                    </div>
                                    <span className="font-medium text-text-primary">Sinh viên {i}</span>
                                </div>
                            ))}
                        </>
                    )}
                </aside>
            </div>
        </div>
    );
};

export default MainLayout;
