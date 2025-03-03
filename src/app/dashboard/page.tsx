// src/app/dashboard/page.tsx
'use client';

import { Card, CardBody, CardHeader } from "@heroui/react";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import usePurchaseStore from '@/app/store/purchaseStore';

export default function DashboardPage() {
  const {
    purchases,
    purchaseStatuses,
    setPurchaseStatus,
    setError,
    error,
    isLoading,
  } = usePurchaseStore();

  const [activeUsers, setActiveUsers] = useState(0);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    console.log(purchaseStatuses);
    const calculateActiveUsers = () => {
      // Count users who have started training and are not invalid
      const activeCount = Object.values(purchaseStatuses).filter(status => 
        (status?.startedTraining || status?.startedTraining_with_VR) && 
        !status?.isInvalidAccount
      ).length;

      setActiveUsers(activeCount);

      // Prepare chart data based on activation records
      const activationsByDate = new Map();
      
      Object.values(purchaseStatuses).forEach(status => {
        if (status?.activationRecords?.length > 0) {
          status.activationRecords.forEach(record => {
            const date = new Date(record.activation_date).toISOString().split('T')[0];
            activationsByDate.set(date, (activationsByDate.get(date) || 0) + 1);
          });
        }
      });

      // Get last 7 days
      const last7Days = [...Array(7)].map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const newChartData = last7Days.map(date => ({
        date,
        activations: activationsByDate.get(date) || 0
      }));

      setChartData(newChartData);
    };

    if (!isLoading && Object.keys(purchaseStatuses).length > 0) {
      calculateActiveUsers();
    }
  }, [purchaseStatuses, isLoading]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-white/10 dark:bg-default-100/50">
          <CardHeader className="pb-2 pt-4 px-4 flex-col items-start">
            <p className="text-tiny uppercase font-bold">Active Users</p>
            <small className="text-default-500">Current active subscriptions</small>
          </CardHeader>
          <CardBody className="py-4">
            <h1 className="text-4xl font-bold">{activeUsers}</h1>
          </CardBody>
        </Card>

        <Card className="bg-white/10 dark:bg-default-100/50">
          <CardHeader className="pb-2 pt-4 px-4 flex-col items-start">
            <p className="text-tiny uppercase font-bold">Total Purchases</p>
            <small className="text-default-500">All-time purchases</small>
          </CardHeader>
          <CardBody className="py-4">
            <h1 className="text-4xl font-bold">{Object.keys(purchaseStatuses).length}</h1>
          </CardBody>
        </Card>

        <Card className="bg-white/10 dark:bg-default-100/50">
          <CardHeader className="pb-2 pt-4 px-4 flex-col items-start">
            <p className="text-tiny uppercase font-bold">Started Training</p>
            <small className="text-default-500">Users in training</small>
          </CardHeader>
          <CardBody className="py-4">
            <h1 className="text-4xl font-bold">
              {Object.values(purchaseStatuses).filter(
                status => status?.startedTraining || status?.startedTraining_with_VR
              ).length}
            </h1>
          </CardBody>
        </Card>
      </div>

      <Card className="w-full h-[400px]">
        <CardHeader>
          <h3 className="text-xl font-bold">Activations Trend</h3>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="activations" fill="#0070F3" />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
    </div>
  );
}