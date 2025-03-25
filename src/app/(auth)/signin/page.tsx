'use client';

import React, { useState, useEffect } from 'react';
import {
  Input,
  Button,
  Spinner,
  Form,
  Card,
  CardBody,
  CardHeader,
} from "@heroui/react";
import { EyeSlashFilledIcon, EyeFilledIcon } from '@/components/icons';
import { doCredentialLogin, resendVerificationEmail } from '@/actions';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import usePurchaseStore from '@/store/purchaseStore';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function SignIn() {
  const [isVisible, setIsVisible] = React.useState(false);
  const [error, setError] = useState(null);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [isPending, startTransition] = useTransition();
  const { reset } = usePurchaseStore();
  const { status } = useSession();
  const toggleVisibility = () => setIsVisible(!isVisible);
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/purchases');
    }
  }, [status, router]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const formData = new FormData(event.currentTarget as HTMLFormElement);
        const response = await doCredentialLogin(formData);

        if (response.error) {
          setError(response.error);
        } else if (response.success) {
          router.refresh();
          router.push('/purchases');
        }
      } catch (err) {
        setError('An unexpected error occurred');
        console.error(err);
      }
    });
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      const result = await resendVerificationEmail(email);
      if (result.success) {
        setResendSuccess(true);
        setError(null);
        // Reset success message after 5 seconds
        setTimeout(() => setResendSuccess(false), 5000);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  if (status === 'loading') {
    return <Spinner size="lg" color="secondary" />;
  }

  return (
      <Card className="flex justify-center items-center flex-col p-4 mt-24 bg-default-50 rounded-lg shadow-sm max-[600px]:w-full">
        <CardHeader className="flex gap-3">
          <h1 className="text-xl font-bold">Sign in</h1>
        </CardHeader>
        <CardBody>
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.3,
                    ease: 'easeOut',
                  },
                }}
                exit={{
                  opacity: 0,
                  y: -20,
                  transition: {
                    duration: 0.2,
                    ease: 'easeIn',
                  },
                }}
                className="text-md text-red-500 p-2g mb-4 text-center"
              >
                <motion.span
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="inline-block mr-2"
                >
                  ⚠️
                </motion.span>
                {error}
                {error ===
                  'Please check your email to verify it before logging in' && (
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="light"
                      color="secondary"
                      onClick={handleResendVerification}
                      disabled={isResending}
                      className="text-sm"
                    >
                      {isResending ? (
                        <Spinner size="sm" color="secondary" />
                      ) : (
                        'Resend verification email'
                      )}
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
            {resendSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-md text-green-500 p-2 mb-4 text-center"
              >
                Verification email has been resent successfully!
              </motion.div>
            )}
          </AnimatePresence>
          <Form
            className="flex flex-col gap-4 max-[600px]:w-full"
            validationErrors={error}
            onSubmit={handleLogin}
          >
            <Input
              type="email"
              name="email"
              label="Email"
              placeholder="Enter your email"
              variant="bordered"
              className="lg:w-96 sm:w-64"
              onChange={(e) => {
                setError(null);
                setEmail(e.target.value);
              }}
            />
            <Input
              name="password"
              label="Password"
              variant="bordered"
              placeholder="Enter password"
              endContent={
                <button
                  className="focus:outline-none"
                  type="button"
                  aria-label="toggle password visibility"
                  onClick={toggleVisibility}
                >
                  {isVisible ? (
                    <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                  ) : (
                    <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                  )}
                </button>
              }
              type={isVisible ? 'text' : 'password'}
              className="lg:w-96 sm:w-64"
              onChange={(e) => setError(null)}
            />
            <Link
              href="/forgot-password"
              className="text-sm text-secondary hover:text-secondary-400 text-right"
            >
              Forgot password?
            </Link>
            <Button
              color="secondary"
              type="submit"
              className={`
                            text-white 
                            lg:w-96 
                            sm:w-64 
                            transition-all 
                            duration-300
                            ${isPending ? 'opacity-75 cursor-not-allowed' : ''}
                          `}
              disabled={isPending}
            >
              Sign in
            </Button>
          </Form>
        </CardBody>
      </Card>
  );
}
