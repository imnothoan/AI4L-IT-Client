import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface SubjectTheta {
    subject: string;
    theta: number; // -3 to +3
    questionCount: number;
}

interface ThetaProgressRadarProps {
    subjectThetas: SubjectTheta[];
    overallTheta: number;
}

export const ThetaProgressRadar: React.FC<ThetaProgressRadarProps> = ({
    subjectThetas,
    overallTheta
}) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current || subjectThetas.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const width = 400;
        const height = 400;
        const radius = Math.min(width, height) / 2 - 40;
        const levels = 7; // -3, -2, -1, 0, 1, 2, 3

        const g = svg.append('g')
            .attr('transform', `translate(${width / 2}, ${height / 2})`);

        // Scale: theta (-3 to +3) to radius (0 to radius)
        const rScale = d3.scaleLinear()
            .domain([-3, 3])
            .range([0, radius]);

        // Angle for each subject
        const angleSlice = (Math.PI * 2) / subjectThetas.length;

        // Draw circular grid
        for (let level = 0; level <= levels; level++) {
            const theta = -3 + (level * 6 / levels);
            const r = rScale(theta);

            g.append('circle')
                .attr('r', r)
                .attr('fill', 'none')
                .attr('stroke', '#E5E7EB')
                .attr('stroke-width', level === Math.floor(levels / 2) ? 2 : 1);

            // Label
            g.append('text')
                .attr('x', 5)
                .attr('y', -r)
                .attr('font-size', '10px')
                .attr('fill', '#6B7280')
                .text(theta.toFixed(0));
        }

        // Draw axes for each subject
        subjectThetas.forEach((subject, i) => {
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
                .attr('stroke-width', 1);

            // Subject label
            const labelCoord = {
                x: (radius + 25) * Math.cos(angle),
                y: (radius + 25) * Math.sin(angle)
            };

            g.append('text')
                .attr('x', labelCoord.x)
                .attr('y', labelCoord.y)
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'middle')
                .attr('font-weight', 'bold')
                .attr('font-size', '12px')
                .attr('fill', '#1F2937')
                .text(subject.subject);
        });

        // Draw theta polygon
        const coordinates = subjectThetas.map((subject, i) => {
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
            .datum([...coordinates, coordinates[0]]) // Close the path
            .attr('d', lineGenerator)
            .attr('fill', '#6366F1')
            .attr('fill-opacity', 0.3)
            .attr('stroke', '#4F46E5')
            .attr('stroke-width', 2);

        // Data points
        coordinates.forEach((coord, i) => {
            g.append('circle')
                .attr('cx', coord.x)
                .attr('cy', coord.y)
                .attr('r', 5)
                .attr('fill', '#4F46E5')
                .attr('stroke', 'white')
                .attr('stroke-width', 2)
                .on('mouseover', function (this: SVGCircleElement) {
                    d3.select(this).attr('r', 7);
                })
                .on('mouseout', function (this: SVGCircleElement) {
                    d3.select(this).attr('r', 5);
                })
                .append('title')
                .text(subjectThetas[i].subject + ": theta = " + subjectThetas[i].theta.toFixed(2));
        });

    }, [subjectThetas, overallTheta]);

    return (
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                    Subject-Level Ability Profile
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                    Overall Theta: <span className="font-bold text-indigo-600">{overallTheta.toFixed(2)}</span>
                </p>
            </div>
            <svg ref={svgRef} width={400} height={400}></svg>
        </div>
    );
};
