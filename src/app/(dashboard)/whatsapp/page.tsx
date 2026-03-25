import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, Bell, Settings, Smartphone, CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "WhatsApp Integration",
};

const notificationTemplates = [
  {
    name: "Appointment Reminder",
    description: "Send reminder 24 hours before appointment",
    trigger: "Automatic",
    status: "Active",
  },
  {
    name: "Appointment Confirmation",
    description: "Confirm appointment booking with patient",
    trigger: "On Booking",
    status: "Active",
  },
  {
    name: "Lab Results Ready",
    description: "Notify patient when lab results are available",
    trigger: "On Completion",
    status: "Inactive",
  },
  {
    name: "Prescription Ready",
    description: "Alert patient when prescription is ready for pickup",
    trigger: "On Dispensing",
    status: "Active",
  },
  {
    name: "Follow-up Reminder",
    description: "Remind patient about scheduled follow-up",
    trigger: "3 Days Before",
    status: "Inactive",
  },
  {
    name: "Payment Receipt",
    description: "Send payment confirmation to patient",
    trigger: "On Payment",
    status: "Active",
  },
];

export default function WhatsAppPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-green-500" />
          WhatsApp Integration
        </h1>
        <p className="text-muted-foreground mt-1">
          Automated patient communication via WhatsApp Business API
        </p>
      </div>

      {/* Status Banner */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Smartphone className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-yellow-900">WhatsApp Integration — Configuration Required</p>
              <p className="text-sm text-yellow-700 mt-1">
                This module requires a WhatsApp Business API account. Configure your API credentials
                in the settings to activate automated patient messaging.
              </p>
              <Button size="sm" className="mt-3 bg-yellow-600 hover:bg-yellow-700 text-white">
                <Settings className="h-4 w-4 mr-2" />
                Configure API Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Messages Sent", value: "0", icon: Send, color: "text-blue-600" },
          { label: "Delivered", value: "0", icon: CheckCircle, color: "text-green-600" },
          { label: "Active Templates", value: notificationTemplates.filter(t => t.status === "Active").length.toString(), icon: Bell, color: "text-purple-600" },
          { label: "Opt-ins", value: "0", icon: Smartphone, color: "text-orange-600" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Notification Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notification Templates</CardTitle>
          <CardDescription>
            Pre-configured message templates for automated patient communication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {notificationTemplates.map((template, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                    <MessageCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{template.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {template.description}
                    </p>
                    <Badge variant="outline" className="text-[10px] mt-1.5">
                      Trigger: {template.trigger}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={template.status === "Active" ? "success" : "gray"}
                    className="text-xs"
                  >
                    {template.status}
                  </Badge>
                  <Button variant="outline" size="sm" className="h-7 text-xs" disabled>
                    Configure
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Configuration Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">API Configuration</CardTitle>
          <CardDescription>
            WhatsApp Business API credentials and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: "API Endpoint", value: "Not configured", status: "error" },
                { label: "Phone Number ID", value: "Not configured", status: "error" },
                { label: "Access Token", value: "Not configured", status: "error" },
                { label: "Webhook URL", value: `${process.env.NEXTAUTH_URL || "https://your-domain.com"}/api/webhooks/whatsapp`, status: "info" },
              ].map((config) => (
                <div key={config.label} className="rounded-md border p-3">
                  <p className="text-xs font-medium text-muted-foreground">{config.label}</p>
                  <p className="text-sm mt-1 font-mono truncate">
                    {config.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-md bg-muted/50 p-4 text-sm">
              <p className="font-medium mb-2">Setup Instructions:</p>
              <ol className="space-y-1.5 text-muted-foreground list-decimal list-inside">
                <li>Create a Meta Developer account and set up a WhatsApp Business app</li>
                <li>Obtain your Phone Number ID and Access Token from Meta Developer Console</li>
                <li>Configure the environment variables in your <code className="bg-muted px-1 rounded text-xs">.env</code> file</li>
                <li>Register the webhook URL in your Meta app settings</li>
                <li>Test the integration using the built-in test tools</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
