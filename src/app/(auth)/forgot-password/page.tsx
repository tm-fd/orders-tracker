'use client';

import React, { useEffect, useState } from 'react';
import {
  Input,
  Button,
  Card,
  CardBody,
  CardHeader,
  Form,
} from "@heroui/react";
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const searchParams = useSearchParams();
  const verified = searchParams.get('verified');

  useEffect(() => {}, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${process.env.CLOUDRUN_DEV_URL}/auth_admin/forgot-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.message || 'Something went wrong');
      }
    } catch (err) {
      setError('Failed to process request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center flex-col p-4 mt-24 bg-default-50 rounded-lg shadow-lg max-[600px]:w-full">
      <Card className="flex justify-center items-center flex-col p-4 bg-default-50 shadow-lg max-[600px]:w-full">
        <CardHeader className="flex gap-3">
          {verified ? (
            <h1 className="text-xl font-bold">
              Please add your email to set a new password
            </h1>
          ) : (
            <h1 className="text-xl font-bold">Reset Password</h1>
          )}
        </CardHeader>
        <CardBody>
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-green-500 text-center"
              >
                Check your email for password reset instructions.
              </motion.div>
            ) : (
              <Form
                className="flex flex-col gap-4 max-[600px]:w-full"
                validationErrors={error}
                onSubmit={handleSubmit}
              >
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
                  type="email"
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  variant="bordered"
                  className="lg:w-96 sm:w-64"
                  required
                />
                <Button
                  color="secondary"
                  type="submit"
                  className="w-full text-white "
                  isLoading={isLoading}
                >
                  Send Reset Link
                </Button>
              </Form>
            )}
          </AnimatePresence>
        </CardBody>
      </Card>
    </div>
  );
}
