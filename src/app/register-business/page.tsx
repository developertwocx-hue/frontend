"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { tenantService } from "@/lib/tenant";

const businessSchema = z.object({
  business_name: z.string().min(2, "Business name must be at least 2 characters"),
  business_email: z.string().email("Invalid email address"),
  business_phone: z.string().optional(),
  business_address: z.string().optional(),
  admin_name: z.string().min(2, "Name must be at least 2 characters"),
  admin_email: z.string().email("Invalid email address"),
  admin_password: z.string().min(6, "Password must be at least 6 characters"),
  admin_password_confirmation: z.string(),
}).refine((data) => data.admin_password === data.admin_password_confirmation, {
  message: "Passwords don't match",
  path: ["admin_password_confirmation"],
});

type BusinessFormData = z.infer<typeof businessSchema>;

export default function RegisterBusinessPage() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
  });

  const onSubmit = async (data: BusinessFormData) => {
    setLoading(true);
    setError("");

    try {
      await tenantService.registerBusiness(data);
      router.push("/dashboard");
    } catch (err: any) {
      // Handle validation errors from backend
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        // Format validation errors in a user-friendly way
        const errorMessages = Object.entries(errors)
          .map(([field, messages]: [string, any]) => {
            const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
            const messageList = Array.isArray(messages) ? messages : [messages];
            return `${fieldName}: ${messageList.join(', ')}`;
          })
          .join('\n');
        setError(errorMessages);
      } else {
        setError(err.response?.data?.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-primary-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Register Your Business</CardTitle>
          <CardDescription>
            Start managing your fleet with Cranelift SaaS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md whitespace-pre-line">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Business Information</h3>

              <div className="space-y-2">
                <Label htmlFor="business_name">Business Name *</Label>
                <Input
                  id="business_name"
                  placeholder="ABC Crane Services"
                  {...register("business_name")}
                />
                {errors.business_name && (
                  <p className="text-sm text-destructive">{errors.business_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_email">Business Email *</Label>
                <Input
                  id="business_email"
                  type="email"
                  placeholder="contact@abccrane.com"
                  {...register("business_email")}
                />
                {errors.business_email && (
                  <p className="text-sm text-destructive">{errors.business_email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_phone">Business Phone</Label>
                <Input
                  id="business_phone"
                  placeholder="+1 234 567 8900"
                  {...register("business_phone")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_address">Business Address</Label>
                <Textarea
                  id="business_address"
                  placeholder="123 Main Street, City, State, ZIP"
                  {...register("business_address")}
                />
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-semibold">Administrator Account</h3>

              <div className="space-y-2">
                <Label htmlFor="admin_name">Admin Name *</Label>
                <Input
                  id="admin_name"
                  placeholder="John Doe"
                  {...register("admin_name")}
                />
                {errors.admin_name && (
                  <p className="text-sm text-destructive">{errors.admin_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin_email">Admin Email *</Label>
                <Input
                  id="admin_email"
                  type="email"
                  placeholder="admin@abccrane.com"
                  {...register("admin_email")}
                />
                {errors.admin_email && (
                  <p className="text-sm text-destructive">{errors.admin_email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin_password">Password *</Label>
                <Input
                  id="admin_password"
                  type="password"
                  placeholder="••••••••"
                  {...register("admin_password")}
                />
                {errors.admin_password && (
                  <p className="text-sm text-destructive">{errors.admin_password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin_password_confirmation">Confirm Password *</Label>
                <Input
                  id="admin_password_confirmation"
                  type="password"
                  placeholder="••••••••"
                  {...register("admin_password_confirmation")}
                />
                {errors.admin_password_confirmation && (
                  <p className="text-sm text-destructive">{errors.admin_password_confirmation.message}</p>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating Business...
                </>
              ) : (
                "Register Business"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
