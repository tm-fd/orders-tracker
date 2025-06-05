"use client";

import React, { useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/react";
import {
  ClipboardList,
  Clock,
  Play,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { useTodoStore } from "@/store/todoStore";

const TodoStats: React.FC = () => {
  const { stats, getStats } = useTodoStore();

  useEffect(() => {
    getStats();
  }, []);

  const statCards = [
    // {
    //   title: "Total Todos",
    //   value: stats.total,
    //   icon: ClipboardList,
    //   color: "bg-blue-500",
    //   textColor: "text-blue-600",
    //   bgColor: "bg-blue-50",
    // },
    {
      title: "Pending",
      value: stats.pending,
      icon: Clock,
      color: "bg-yellow-500",
      textColor: "text-yellow-600",
      bgColor: "bg-yellow-200",
    },
    {
      title: "In Progress",
      value: stats.inProgress,
      icon: Play,
      color: "bg-purple-500",
      textColor: "text-purple-600",
      bgColor: "bg-purple-200",
    },
    {
      title: "Completed",
      value: stats.completed,
      icon: CheckCircle,
      color: "bg-green-600",
      textColor: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Overdue",
      value: stats.overdue,
      icon: AlertTriangle,
      color: "bg-red-500",
      textColor: "text-red-600",
      bgColor: "bg-red-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;

        return (
          <Card key={index} className={`${stat.bgColor} border-none`}>
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${stat.textColor}`}>
                    {stat.title}
                  </p>
                  <p className={`text-2xl font-bold ${stat.textColor}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
};

export default TodoStats;
