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
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
      <Card className="flex justify-center items-center flex-col p-4 mt-24 bg-default-50 shadow-none max-[600px]:w-full">
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
          <div className=" flex flex-col gap-4">
          <button className="inline-flex items-center justify-center gap-3 py-3 text-sm font-normal text-gray-700 transition-colors bg-gray-100 rounded-lg px-7 hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18.7511 10.1944C18.7511 9.47495 18.6915 8.94995 18.5626 8.40552H10.1797V11.6527H15.1003C15.0011 12.4597 14.4654 13.675 13.2749 14.4916L13.2582 14.6003L15.9087 16.6126L16.0924 16.6305C17.7788 15.1041 18.7511 12.8583 18.7511 10.1944Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M10.1788 18.75C12.5895 18.75 14.6133 17.9722 16.0915 16.6305L13.274 14.4916C12.5201 15.0068 11.5081 15.3666 10.1788 15.3666C7.81773 15.3666 5.81379 13.8402 5.09944 11.7305L4.99473 11.7392L2.23868 13.8295L2.20264 13.9277C3.67087 16.786 6.68674 18.75 10.1788 18.75Z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.10014 11.7305C4.91165 11.186 4.80257 10.6027 4.80257 9.99992C4.80257 9.3971 4.91165 8.81379 5.09022 8.26935L5.08523 8.1534L2.29464 6.02954L2.20333 6.0721C1.5982 7.25823 1.25098 8.5902 1.25098 9.99992C1.25098 11.4096 1.5982 12.7415 2.20333 13.9277L5.10014 11.7305Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M10.1789 4.63331C11.8554 4.63331 12.9864 5.34303 13.6312 5.93612L16.1511 3.525C14.6035 2.11528 12.5895 1.25 10.1789 1.25C6.68676 1.25 3.67088 3.21387 2.20264 6.07218L5.08953 8.26943C5.81381 6.15972 7.81776 4.63331 10.1789 4.63331Z"
                    fill="#EB4335"
                  />
                </svg>
                Sign in with Google
              </button>
              <button className="inline-flex items-center justify-center gap-3 py-3 text-sm font-normal text-gray-700 transition-colors bg-gray-100 rounded-lg px-7 hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10">
                <svg
                  width="21"
                  className="fill-current"
                  height="20"
                  viewBox="0 0 21 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M15.6705 1.875H18.4272L12.4047 8.75833L19.4897 18.125H13.9422L9.59717 12.4442L4.62554 18.125H1.86721L8.30887 10.7625L1.51221 1.875H7.20054L11.128 7.0675L15.6705 1.875ZM14.703 16.475H16.2305L6.37054 3.43833H4.73137L14.703 16.475Z" />
                </svg>
                Sign in with Linkedin
              </button>
            
            <div className="relative py-3 sm:py-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="p-2 text-gray-400 bg-default-50 dark:bg-gray-900 sm:px-5 sm:py-2">
                  Or
                </span>
              </div>
            </div>
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
          </div>
        </CardBody>
      </Card>
      </div>
      </div>
  );
}
