"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { tenantService, Tenant } from "@/lib/tenant";

export default function SettingsPage() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { register, handleSubmit, setValue } = useForm();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await tenantService.getCurrentTenant();
        const tenantData = response.data;
        setTenant(tenantData);
        setValue("name", tenantData.name);
        setValue("email", tenantData.email);
        setValue("phone", tenantData.phone);
        setValue("address", tenantData.address);
      } catch (error) {
        console.error("Failed to fetch tenant:", error);
      }
    };

    const userData = localStorage.getItem("user");
    if (userData) setUser(JSON.parse(userData));

    fetchData();
  }, [setValue]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await tenantService.updateTenant(data);
      alert("Settings updated successfully!");
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = user?.role === "admin";

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Settings
          </h1>
          <p className="text-muted-foreground mt-2">Manage your business and account settings</p>
        </div>

        {!isAdmin && (
          <Card className="border-muted-foreground/20 bg-muted">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-foreground">
                  Only business administrators can modify these settings.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>
              Update your business details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Business Name</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    disabled={!isAdmin}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Business Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    disabled={!isAdmin}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    {...register("phone")}
                    disabled={!isAdmin}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Business Address</Label>
                  <Textarea
                    id="address"
                    rows={3}
                    {...register("address")}
                    disabled={!isAdmin}
                  />
                </div>
              </div>

              {isAdmin && (
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {tenant && (
          <Card>
            <CardHeader>
              <CardTitle>Subscription Information</CardTitle>
              <CardDescription>
                Your current subscription details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Plan</p>
                  <p className="text-lg font-semibold capitalize">{tenant.subscription_plan}</p>
                </div>
                <Badge className="bg-primary/20 text-primary border-primary/50 hover:bg-primary/20">
                  Active
                </Badge>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground">Subscription End Date</p>
                <p className="text-lg font-semibold">
                  {new Date(tenant.subscription_ends_at).toLocaleDateString()}
                </p>
              </div>

              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-primary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      30-Day Free Trial
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      You're currently on a 30-day free trial. Upgrade to continue using Cranelift SaaS after your trial expires.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Your personal account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-base font-semibold">{user?.name}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-base font-semibold">{user?.email}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <Badge className="capitalize bg-primary/20 text-primary border-primary/50 hover:bg-primary/20">
                  {user?.role}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
