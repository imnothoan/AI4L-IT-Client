import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface ThetaChartProps {
    theta: number; // Current ability estimate (-3 to +3)
    standardError?: number; // Standard error (0 to 1)
    history?: number[]; // Historical theta values
}

export const ThetaChart: React.FC<ThetaChartProps> = ({
    theta,
    standardError = 0.5,
    history = []
}) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove(); // Clear previous render

        const width = 400;
        const height = 160;
        const margin = { top: 20, right: 20, bottom: 30, left: 50 };

        // Scale for theta (-3 to +3)
        const xScale = d3.scaleLinear()
            .domain([-3, 3])
            .range([0, width - margin.left - margin.right]);

        // Create gauge-style visualization
        const g = svg.append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        // Background bar (full range)
        g.append('rect')
            .attr('x', 0)
            .attr('y', 40)
            .attr('width', xScale(3))
            .attr('height', 20)
            .attr('fill', '#E5E7EB')
            .attr('rx', 10);

        // Ability bar (current theta)
        const thetaX = xScale(theta);
        const colorScale = d3.scaleSequential()
            .domain([-3, 3])
            .interpolator(d3.interpolateRdYlGn);

        g.append('rect')
            .attr('x', xScale(-3))
            .attr('y', 40)
            .attr('width', thetaX - xScale(-3))
            .attr('height', 20)
            .attr('fill', colorScale(theta))
            .attr('rx', 10);

        // Standard error indicator
        const errorMargin = standardError * 50;
        g.append('rect')
            .attr('x', Math.max(0, thetaX - errorMargin))
            .attr('y', 35)
            .attr('width', errorMargin * 2)
            .attr('height', 30)
            .attr('fill', 'none')
            .attr('stroke', '#6366F1')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '4,4')
            .attr('rx', 5);

        // Current value marker
        g.append('circle')
            .attr('cx', thetaX)
            .attr('cy', 50)
            .attr('r', 8)
            .attr('fill', '#4F46E5')
            .attr('stroke', 'white')
            .attr('stroke-width', 2);

        // Axis labels
        const axis = d3.axisBottom(xScale)
            .tickValues([-3, -2, -1, 0, 1, 2, 3])
            .tickFormat((d: d3.NumberValue) => {
                const val = Number(d);
                return val === 0 ? 'Avg' : `${val > 0 ? '+' : ''}${val}`;
            });

        g.append('g')
            .attr('transform', `translate(0, 70)`)
            .call(axis)
            .selectAll('text')
            .style('font-size', '12px');

        // Theta value display
        g.append('text')
            .attr('x', thetaX)
            .attr('y', 25)
            .attr('text-anchor', 'middle')
            .attr('font-weight', 'bold')
            .attr('font-size', '14px')
            .attr('fill', '#1F2937')
            .text(`θ = ${theta.toFixed(2)}`);

        // History line chart (if available)
        if (history.length > 1) {
            const yScale = d3.scaleLinear()
                .domain([-3, 3])
                .range([120, 20]);

            const line = d3.line<number>()
                .x((_d: number, i: number) => (i / (history.length - 1)) * (width - margin.left - margin.right))
                .y((d: number) => yScale(d));

            g.append('path')
                .datum(history)
                .attr('fill', 'none')
                .attr('stroke', '#6366F1')
                .attr('stroke-width', 2)
                .attr('d', line)
                .attr('transform', 'translate(0, -20)');
        }

    }, [theta, standardError, history]);

    return (
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="mb-2">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Ability Estimate (θ)
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                    Your current performance level • SE: ±{standardError.toFixed(2)}
                </p>
            </div>
            <svg ref={svgRef} width={400} height={160}></svg>
        </div>
    );
};
