/**
 * Progress Indicator Component
 *
 * Circular progress chart showing task statistics
 */

'use client';

import React from 'react';

interface ProgressIndicatorProps {
  stats: {
    notStarted: number;
    inProgress: number;
    completed: number;
  };
  totalTasks: number;
}

export function ProgressIndicator({ stats, totalTasks }: ProgressIndicatorProps) {
  const completionPercentage = totalTasks > 0
    ? Math.round((stats.completed / totalTasks) * 100)
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Progress Overview</h2>

      <div className="flex items-center gap-8">
        {/* Circular Progress */}
        <div className="relative flex items-center justify-center">
          <svg className="w-32 h-32 transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="#E5E7EB"
              strokeWidth="12"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="#10B981"
              strokeWidth="12"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${2 * Math.PI * 56 * (1 - completionPercentage / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{completionPercentage}%</div>
              <div className="text-xs text-gray-500">Complete</div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="flex-1 grid grid-cols-3 gap-4">
          {/* Not Started */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span className="text-xs font-medium text-gray-600">Not Started</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.notStarted}</div>
            <div className="text-xs text-gray-500 mt-1">
              {totalTasks > 0 ? Math.round((stats.notStarted / totalTasks) * 100) : 0}% of total
            </div>
          </div>

          {/* In Progress */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-xs font-medium text-blue-600">In Progress</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">{stats.inProgress}</div>
            <div className="text-xs text-blue-600 mt-1">
              {totalTasks > 0 ? Math.round((stats.inProgress / totalTasks) * 100) : 0}% of total
            </div>
          </div>

          {/* Completed */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs font-medium text-green-600">Completed</span>
            </div>
            <div className="text-2xl font-bold text-green-900">{stats.completed}</div>
            <div className="text-xs text-green-600 mt-1">
              {totalTasks > 0 ? Math.round((stats.completed / totalTasks) * 100) : 0}% of total
            </div>
          </div>
        </div>
      </div>

      {/* Total Tasks */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Total Tasks</span>
          <span className="font-semibold text-gray-900">{totalTasks}</span>
        </div>
      </div>
    </div>
  );
}
