'use client';

import React, { useState } from 'react';
import {
  Input,
  Button,
  Card,
  CardBody,
  CardHeader,
  Form,
  Select,
  SelectItem,
} from "@heroui/react";
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EyeSlashFilledIcon, EyeFilledIcon } from '@/components/icons';
import Joi from 'joi';
import { registerUser } from '@/actions';
import { LoadingSpinner, CheckIcon } from '@/components/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';




export default function Register() {
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const roleOptions = [
    { label: 'Admin', value: 'ADMIN' },
    { label: 'User', value: 'USER' },
    { label: 'Subadmin', value: 'SUBADMIN' },
    { label: 'Teacher', value: 'TEACHER' },
    { label: 'Editor', value: 'EDITOR' },
  ];
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [errors, setErrors] = useState({});
  const [isSuccess, setIsSuccess] = useState(false);
  const { data: session } = useSession();


  function JoiValidateForm(obj: any) {
    const schema = Joi.object({
      name: Joi.string().required().min(2).messages({
        'string.empty': `Name is required`,
        'string.min': `Name must be at least 2 characters`,
      }),
      email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: false } })
        .required()
        .trim()
        .messages({
          'string.email': `Email must be valid`,
          'string.required': `Email is required`,
        }),
      role: Joi.string().required().valid('ADMIN', 'USER', 'SUBADMIN', 'TEACHER', 'EDITOR').messages({
        'string.empty': `Role is required`,
        'any.only': 'Please select a valid role',
      }),
      password: Joi.string().required().min(8).messages({
        'string.required': `Password must be valid`,
        'string.min': `Password must be at least 8 characters`,
      }),
      confirmPassword: Joi.any()
        .valid(Joi.ref('password'))
        .required()
        .messages({
          'any.only': 'Password must match',
        }),
    });

    return schema.validate(obj);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session) {
      console.error('Not authenticated');
      return;
    }
    if (isPending || isSuccess) {
        return;
      }
    setErrors({});
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const { error } = JoiValidateForm(data);

    if (error) {
      setErrors(
        error.details.reduce((acc, detail) => {
          acc[detail.path[0]] = detail.message;
          return acc;
        }, {})
      );
      return;
    }
    const userData = {
      name: data.name as string,
      email: data.email as string,
      password: data.password as string,
      role: data.role as string,
    }

    try {
      startTransition(async () => {
            const { data, error } = await registerUser(userData, session.user.sessionToken);


        if (error) {
          setErrors({ form: error });
          return;
        }

        if (data) {
            setIsSuccess(true);
          setTimeout(() => {
            setIsSuccess(false);
          }, 3000);
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ form: 'An error occurred during registration' });
    }
  };

  return (
    <div className="flex justify-center items-start min-h-screen pt-20">
      <Card className="flex justify-center items-center flex-col p-4 bg-default-50 shadow-lg max-[600px]:w-full">
        <CardHeader className="flex gap-3">
          <h1 className="text-xl font-bold">Register admin</h1>
        </CardHeader>
        <CardBody>
        <AnimatePresence mode="wait"> 
        {errors.form && (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          transition: {
            duration: 0.3,
            ease: "easeOut"
          }
        }}
        exit={{ 
          opacity: 0,
          y: -20,
          transition: {
            duration: 0.2,
            ease: "easeIn"
          }
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
        {errors.form}
      </motion.div>
    )}
      </AnimatePresence>
          <Form
            className="flex flex-col gap-4 max-[600px]:w-full"
            validationErrors={errors}
            onSubmit={handleSubmit}
          >
            <Input
              type="text"
              label="Name"
              name="name"
              placeholder="Enter your name"
              variant="bordered"
              value={name}
              className="lg:w-96 sm:w-64"
              onChange={(e) => setName(e.target.value)}
              isRequired
            />
            <Input
              type="email"
              label="Email"
              name="email"
              placeholder="Enter your email"
              variant="bordered"
              value={email}
              className="lg:w-96 sm:w-64"
              onChange={(e) => setEmail(e.target.value)}
              isRequired
            />
            <Input
              label="Password"
              name="password"
              variant="bordered"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              isRequired
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
            />
            <Input
              label="Confirm Password"
              name="confirmPassword"
              variant="bordered"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              isRequired
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
            />
            <Select
              label="Role"
              placeholder="Select a role"
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="lg:w-96 sm:w-64"
              isRequired
            >
              {roleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>
            <Button
              color="secondary"
              type="submit"
              className={`
                text-white 
                lg:w-96 
                sm:w-64 
                transition-all 
                duration-300
                ${isPending || isSuccess ? 'opacity-75 cursor-not-allowed' : ''}
                ${isSuccess ? 'bg-green-600 hover:bg-green-700' : ''}
              `}
              disabled={isPending || isSuccess}
            >
              <AnimatePresence mode="wait">
    {isSuccess ? (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        className="flex items-center justify-center gap-2"
      >
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.5 }}
        >
          <CheckIcon />
        </motion.div>
        Registration success!
      </motion.div>
    ) : isPending ? (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex items-center justify-center gap-2"
      >
        <LoadingSpinner />
        Processing...
      </motion.div>
    ) : (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        Register
      </motion.div>
    )}
  </AnimatePresence>
</Button>
          </Form>
        </CardBody>
      </Card>
    </div>
  );
}
