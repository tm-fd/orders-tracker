// app/(auth)/reset-password/page.tsx
'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Input, Button, Card, CardBody, CardHeader } from "@heroui/react";
import { motion } from 'framer-motion';
import { EyeSlashFilledIcon, EyeFilledIcon } from '@/components/icons';

export default function ResetPassword() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  if (!token) {
    return (
      <div className="text-center mt-24">Invalid or expired reset link.</div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.CLOUDRUN_DEV_URL}/auth_admin/reset-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            newPassword: formData.password,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        router.push(
          '/signin?message=Password reset successful. Please sign in.'
        );
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center flex-col p-4 mt-24 bg-default-50 rounded-lg shadow-lg max-[600px]:w-full">
      <Card className="flex justify-center items-center flex-col p-4 bg-default-50 shadow-lg max-[600px]:w-full">
        <CardHeader className="flex gap-3">
          <h1 className="text-xl font-bold">Set New Password</h1>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-500 text-center"
              >
                {error}
              </motion.div>
            )}
            <Input
              type={isVisible ? 'text' : 'password'}
              label="New Password"
              value={formData.password}
              className="lg:w-96 sm:w-64"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  password: e.target.value,
                }))
              }
              endContent={
                <button type="button" onClick={() => setIsVisible(!isVisible)}>
                  {isVisible ? <EyeSlashFilledIcon /> : <EyeFilledIcon />}
                </button>
              }
              required
            />

            <Input
              type={isVisible ? 'text' : 'password'}
              label="Confirm Password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  confirmPassword: e.target.value,
                }))
              }
              required
            />

            <Button
              color="secondary"
              type="submit"
              className="w-full text-white"
              isLoading={isLoading}
            >
              Reset Password
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
