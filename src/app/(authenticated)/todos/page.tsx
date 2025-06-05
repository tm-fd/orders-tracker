'use client';

import React from 'react';
import { Card, CardBody } from '@heroui/react';
import TodoList from '@/components/todos/TodoList';

export default function TodosPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <TodoList />
      </div>
    </div>
  );
};
