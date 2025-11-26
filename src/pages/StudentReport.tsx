import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface SubjectScore {
    subject: string;
    theta: number;
    percentile: number;
    questionsAnswered: number;
}

interface StudentReportProps {
    studentName: string;
    overallTheta: number;
    subjectScores: SubjectScore[];
    examHistory: {
        examTitle: string;
        date: string;
        score: number;
        theta: number;
    }[];
}

export const StudentReport: React.FC<StudentReportProps> = ({
    studentName,
    overallTheta,
    subjectScores,
    examHistory
}) => {
    const radarRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!radarRef.current || subjectScores.length === 0) return;

        const svg = d3.select(radarRef.current);
        svg.selectAll('*').remove();

        const width = 500;
        const height = 500;
        const radius = Math.min(width, height) / 2 - 60;
        const levels = 5; // Number of concentric circles

        const g = svg.append('g')
            .attr('transform', `translate(${width / 2}, ${height / 2})`);

        // Scale for theta values
        const rScale = d3.scaleLinear()
            .domain([-3, 3])
            .range([0, radius]);

        const angleSlice = (Math.PI * 2) / subjectScores.length;

        // Draw circular grid
        for (let level = 0; level <= levels; level++) {
            const theta = -3 + (level * 6 / levels);
            const r = rScale(theta);

            g.append('circle')
                .attr('r', r)
                .attr('fill', 'none')
                .attr('stroke', level === Math.floor(levels / 2) ? '#3B82F6' : '#E5E7EB')
                .attr('stroke-width', level === Math.floor(levels / 2) ? 2 : 1)
                .attr('stroke-dasharray', level === Math.floor(levels / 2) ? '0' : '4,4');

            // Label at 0 degrees (top)
            if (level > 0) {
                g.append('text')
                    .attr('x', 5)
                    .attr('y', -r + 3)
                    .attr('font-size', '11px')
                    .attr('fill', '#6B7280')
                    .attr('font-weight', level === Math.floor(levels / 2) ? 'bold' : 'normal')
                    .text(theta.toFixed(1));
            }
        }

        // Draw axes
        subjectScores.forEach((subject, i) => {
            const angle = angleSlice * i - Math.PI / 2;
            const lineCoord = {
                x: radius * Math.cos(angle),
                y: radius * Math.sin(angle)
            };

            g.append('line')
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', lineCoord.x)
                .attr('y2', lineCoord.y)
                .attr('stroke', '#D1D5DB')
                .attr('stroke-width', 1.5);

            // Subject label
            const labelCoord = {
                x: (radius + 40) * Math.cos(angle),
                y: (radius + 40) * Math.sin(angle)
            };

            g.append('text')
                .attr('x', labelCoord.x)
                .attr('y', labelCoord.y)
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'middle')
                .attr('font-weight', 'bold')
                .attr('font-size', '13px')
                .attr('fill', '#1F2937')
                .text(subject.subject);

            // Percentile badge
            g.append('text')
                .attr('x', labelCoord.x)
                .attr('y', labelCoord.y + 15)
                .attr('text-anchor', 'middle')
                .attr('font-size', '10px')
                .attr('fill', '#6B7280')
                .text(`${subject.percentile}%`);
        });

        // Draw data polygon
        const coordinates = subjectScores.map((subject, i) => {
            const angle = angleSlice * i - Math.PI / 2;
            const r = rScale(subject.theta);
            return {
                x: r * Math.cos(angle),
                y: r * Math.sin(angle)
            };
        });

        const lineGenerator = d3.line<{ x: number; y: number }>()
            .x((d: { x: number; y: number }) => d.x)
            .y((d: { x: number; y: number }) => d.y);

        // Filled area
        g.append('path')
            .datum([...coordinates, coordinates[0]])
            .attr('d', lineGenerator)
            .attr('fill', '#3B82F6')
            .attr('fill-opacity', 0.25)
            .attr('stroke', '#2563EB')
            .attr('stroke-width', 3);

        // Data points
        coordinates.forEach((coord, i) => {
            const subject = subjectScores[i];

            g.append('circle')
                .attr('cx', coord.x)
                .attr('cy', coord.y)
                .attr('r', 6)
                .attr('fill', '#2563EB')
                .attr('stroke', 'white')
                .attr('stroke-width', 3)
                .style('cursor', 'pointer')
                .on('mouseover', function (this: SVGCircleElement) {
                    d3.select(this)
                        .transition()
                        .duration(200)
                        .attr('r', 9);
                })
                .on('mouseout', function (this: SVGCircleElement) {
                    d3.select(this)
                        .transition()
                        .duration(200)
                        .attr('r', 6);
                })
                .append('title')
                .text(`${subject.subject}: θ=${subject.theta.toFixed(2)} (${subject.questionsAnswered} câu)`);
        });

    }, [subjectScores]);

    const getGradeLevel = (theta: number): string => {
        if (theta < -1.5) return 'Cần cải thiện';
        if (theta < -0.5) return 'Dưới trung bình';
        if (theta < 0.5) return 'Trung bình';
        if (theta < 1.5) return 'Khá';
        return 'Giỏi';
    };

    const getGradeColor = (theta: number): string => {
        if (theta < -1.5) return 'text-red-600 bg-red-100';
        if (theta < -0.5) return 'text-orange-600 bg-orange-100';
        if (theta < 0.5) return 'text-yellow-600 bg-yellow-100';
        if (theta < 1.5) return 'text-blue-600 bg-blue-100';
        return 'text-green-600 bg-green-100';
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-8 text-white mb-6">
                <h1 className="text-3xl font-bold mb-2">{studentName}</h1>
                <p className="text-blue-100 mb-4">Báo cáo năng lực toàn diện</p>

                <div className="flex items-center gap-6">
                    <div>
                        <div className="text-sm opacity-90">Năng lực tổng quát</div>
                        <div className="text-4xl font-bold">θ = {overallTheta.toFixed(2)}</div>
                    </div>
                    <div className={`px-4 py-2 rounded-full font-semibold ${getGradeColor(overallTheta)} bg-opacity-20 text-white border border-white`}>
                        {getGradeLevel(overallTheta)}
                    </div>
                </div>
            </div>

            {/* Radar Chart */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Biểu đồ năng lực 8 môn học</h2>
                <div className="flex justify-center">
                    <svg ref={radarRef} width={500} height={500}></svg>
                </div>
            </div>

            {/* Subject Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {subjectScores.map((subject, idx) => (
                    <div key={idx} className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-900">{subject.subject}</h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(subject.theta)}`}>
                                {getGradeLevel(subject.theta)}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Năng lực (θ):</span>
                                <span className="font-semibold">{subject.theta.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Vượt qua:</span>
                                <span className="font-semibold text-blue-600">{subject.percentile}% học sinh</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Số câu hỏi:</span>
                                <span className="font-semibold">{subject.questionsAnswered}</span>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-3">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${((subject.theta + 3) / 6) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Exam History */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Lịch sử kiểm tra</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-3 px-4 text-gray-700 font-semibold">Bài kiểm tra</th>
                                <th className="text-left py-3 px-4 text-gray-700 font-semibold">Ngày thi</th>
                                <th className="text-center py-3 px-4 text-gray-700 font-semibold">Điểm</th>
                                <th className="text-center py-3 px-4 text-gray-700 font-semibold">Năng lực (θ)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {examHistory.map((exam, idx) => (
                                <tr key={idx} className="border-b hover:bg-gray-50">
                                    <td className="py-3 px-4">{exam.examTitle}</td>
                                    <td className="py-3 px-4 text-gray-600">{new Date(exam.date).toLocaleDateString('vi-VN')}</td>
                                    <td className="py-3 px-4 text-center">
                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">
                                            {exam.score}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-center font-semibold">{exam.theta.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
