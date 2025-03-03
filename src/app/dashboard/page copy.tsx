// src/app/dashboard/page.tsx
'use client';

import HeatmapChart from '@/components/HeatmapChart';
import { Card, CardBody, CardHeader } from "@heroui/react";

export default function DashboardPage() {
  // Generate sample data for the heatmap
  const generateWeeklyActivityData = () => {
    const daysOfWeek = 7;
    const hoursInDay = 24;
    const data = [];
    
    // Mock data patterns
    const peakHours = [9, 10, 11, 14, 15, 16]; // Business hours
    const weekdays = [1, 2, 3, 4, 5]; // Monday to Friday
    
    for (let day = 0; day < daysOfWeek; day++) {
      for (let hour = 0; hour < hoursInDay; hour++) {
        let baseValue = 20; // Base activity level
        
        // Increase activity during peak hours on weekdays
        if (weekdays.includes(day) && peakHours.includes(hour)) {
          baseValue += 60;
        }
        
        // Add some randomness
        const randomVariation = Math.floor(Math.random() * 20);
        
        // Reduce activity during night hours (0-6)
        if (hour >= 0 && hour < 6) {
          baseValue = Math.floor(Math.random() * 15);
        }
        
        // Reduce activity on weekends
        if (day === 0 || day === 6) {
          baseValue = Math.floor(baseValue * 0.6);
        }
        
        data.push({
          x: hour,
          y: day,
          value: Math.min(100, baseValue + randomVariation) // Ensure value doesn't exceed 100
        });
      }
    }
    return data;
  };

  const mockData = generateWeeklyActivityData();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-white/10 dark:bg-default-100/50">
          <CardHeader className="pb-2 pt-4 px-4 flex-col items-start">
            <p className="text-tiny uppercase font-bold">Total Users</p>
            <small className="text-default-500">All registered users</small>
          </CardHeader>
          <CardBody className="py-4">
            <h1 className="text-4xl font-bold">1,234</h1>
          </CardBody>
        </Card>

        <Card className="bg-white/10 dark:bg-default-100/50">
          <CardHeader className="pb-2 pt-4 px-4 flex-col items-start">
            <p className="text-tiny uppercase font-bold">Active Users</p>
            <small className="text-default-500">Current month</small>
          </CardHeader>
          <CardBody className="py-4">
            <h1 className="text-4xl font-bold">789</h1>
          </CardBody>
        </Card>

        <Card className="bg-white/10 dark:bg-default-100/50">
          <CardHeader className="pb-2 pt-4 px-4 flex-col items-start">
            <p className="text-tiny uppercase font-bold">New Users</p>
            <small className="text-default-500">Last 7 days</small>
          </CardHeader>
          <CardBody className="py-4">
            <h1 className="text-4xl font-bold">123</h1>
          </CardBody>
        </Card>
      </div>

      {/* Heatmap */}
      <div className="grid gap-6">
        <HeatmapChart 
          data={mockData}
          title="Weekly User Activity"
        />
      </div>
    </div>
  );
}