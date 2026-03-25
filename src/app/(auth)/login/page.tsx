"use client";

import React, { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email: data.email.toLowerCase(),
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          result.error === "CredentialsSignin"
            ? "Invalid email or password. Please try again."
            : result.error
        );
        return;
      }

      if (result?.ok) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[hsl(222,47%,11%)] flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-blue-500/10" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-blue-600/10" />
          <div className="absolute top-1/3 left-1/3 w-64 h-64 rounded-full bg-blue-400/5" />
        </div>

        <div className="relative z-10 text-center space-y-8">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-500 shadow-xl">
              <Building2 className="h-10 w-10 text-white" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-white">MedCore HMS</h1>
            <p className="text-xl text-blue-300">Hospital Management System</p>
          </div>

          <p className="text-slate-400 max-w-sm leading-relaxed">
            A comprehensive platform for managing all aspects of your healthcare
            facility — from patient registration to discharge management.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { label: "Patients Managed", value: "10,000+" },
              { label: "Appointments Daily", value: "500+" },
              { label: "Doctors On Platform", value: "200+" },
              { label: "Departments", value: "15+" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg bg-white/5 p-4 text-center"
              >
                <p className="text-2xl font-bold text-blue-400">{stat.value}</p>
                <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile logo */}
          <div className="flex flex-col items-center gap-3 lg:hidden">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold">MedCore HMS</h1>
              <p className="text-muted-foreground text-sm">Hospital Management System</p>
            </div>
          </div>

          <Card className="shadow-lg">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
              <CardDescription>
                Enter your credentials to access the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="doctor@hospital.com"
                    autoComplete="email"
                    leftIcon={<Mail className="h-4 w-4" />}
                    {...register("email")}
                    error={errors.email?.message}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    leftIcon={<Lock className="h-4 w-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    }
                    {...register("password")}
                    error={errors.password?.message}
                    disabled={isLoading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                  loading={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              {/* Demo credentials */}
              <div className="mt-6 rounded-lg bg-muted/50 p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Demo Credentials
                </p>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  {[
                    { role: "Admin", email: "admin@medcore.com", password: "Admin@123" },
                    { role: "Doctor", email: "doctor@medcore.com", password: "Doctor@123" },
                    { role: "Nurse", email: "nurse@medcore.com", password: "Nurse@123" },
                    { role: "Receptionist", email: "reception@medcore.com", password: "Reception@123" },
                  ].map((cred) => (
                    <div key={cred.role} className="flex items-center gap-2">
                      <span className="font-medium text-foreground w-28">{cred.role}:</span>
                      <span className="font-mono">{cred.email}</span>
                    </div>
                  ))}
                  <p className="mt-2 text-xs text-muted-foreground/70">
                    All demo accounts use the password shown above
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            MedCore HMS © {new Date().getFullYear()} · All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
}
