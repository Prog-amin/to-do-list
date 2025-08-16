"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Download,
  Upload,
  FileJson,
  FileSpreadsheet,
  Calendar as CalendarIcon,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { useTasks, useCreateTask } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import type { TaskResponse } from "@shared/api";

export function TaskExportImport() {
  const [exportFormat, setExportFormat] = useState<"json" | "csv" | "ical">(
    "json",
  );
  const [importData, setImportData] = useState("");
  const [importStatus, setImportStatus] = useState<
    "idle" | "success" | "error" | "loading"
  >("idle");
  const [importMessage, setImportMessage] = useState("");
  const [validatedTasks, setValidatedTasks] = useState<any[]>([]);

  const { data: tasksData } = useTasks();
  const createTaskMutation = useCreateTask();
  const { toast } = useToast();
  const tasks = tasksData?.results || [];

  const exportTasks = () => {
    if (!tasks.length) {
      alert("No tasks to export");
      return;
    }

    let content = "";
    let filename = "";
    let mimeType = "";

    switch (exportFormat) {
      case "json":
        content = JSON.stringify(tasks, null, 2);
        filename = `smarttodos-tasks-${new Date().toISOString().split("T")[0]}.json`;
        mimeType = "application/json";
        break;

      case "csv":
        const csvHeaders =
          "Title,Description,Category,Priority,Status,Deadline,Estimated Duration,AI Score,Created At\n";
        const csvRows = tasks
          .map((task) =>
            [
              `"${task.title.replace(/"/g, '""')}"`,
              `"${task.description.replace(/"/g, '""')}"`,
              `"${task.category_name || ""}"`,
              task.priority,
              task.status,
              task.deadline || "",
              task.estimated_duration,
              task.ai_priority_score,
              task.created_at,
            ].join(","),
          )
          .join("\n");
        content = csvHeaders + csvRows;
        filename = `smarttodos-tasks-${new Date().toISOString().split("T")[0]}.csv`;
        mimeType = "text/csv";
        break;

      case "ical":
        const icalHeader = [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "PRODID:-//SmartTodos//Task Export//EN",
          "CALSCALE:GREGORIAN",
        ].join("\r\n");

        const icalEvents = tasks
          .filter((task) => task.deadline)
          .map((task) => {
            const deadline = new Date(task.deadline!);
            const dtstart =
              deadline.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
            const dtend =
              new Date(deadline.getTime() + task.estimated_duration * 60 * 1000)
                .toISOString()
                .replace(/[-:]/g, "")
                .split(".")[0] + "Z";

            return [
              "BEGIN:VEVENT",
              `UID:${task.id}@smarttodos.app`,
              `DTSTART:${dtstart}`,
              `DTEND:${dtend}`,
              `SUMMARY:${task.title}`,
              `DESCRIPTION:${task.description}`,
              `PRIORITY:${task.priority === "urgent" ? "1" : task.priority === "high" ? "3" : task.priority === "medium" ? "5" : "7"}`,
              `STATUS:${task.status === "completed" ? "COMPLETED" : task.status === "in_progress" ? "IN-PROCESS" : "NEEDS-ACTION"}`,
              "END:VEVENT",
            ].join("\r\n");
          })
          .join("\r\n");

        const icalFooter = "END:VCALENDAR";
        content = [icalHeader, icalEvents, icalFooter].join("\r\n");
        filename = `smarttodos-calendar-${new Date().toISOString().split("T")[0]}.ics`;
        mimeType = "text/calendar";
        break;
    }

    // Create and download file
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const validateTasks = () => {
    try {
      const parsed = JSON.parse(importData);

      if (!Array.isArray(parsed)) {
        throw new Error("Data must be an array of tasks");
      }

      // Validate task structure
      const requiredFields = ["title"];
      const validTasks = parsed.filter(
        (task) =>
          typeof task === "object" &&
          requiredFields.every((field) => task.hasOwnProperty(field)),
      );

      if (validTasks.length === 0) {
        throw new Error("No valid tasks found in import data");
      }

      setValidatedTasks(validTasks);
      setImportStatus("success");
      setImportMessage(`Validated ${validTasks.length} tasks ready for import`);
    } catch (error) {
      setImportStatus("error");
      setImportMessage(
        error instanceof Error ? error.message : "Validation failed",
      );
      setValidatedTasks([]);
    }
  };

  const actuallyImportTasks = async () => {
    if (validatedTasks.length === 0) return;

    setImportStatus("loading");
    setImportMessage("Importing tasks...");

    try {
      let successCount = 0;
      let failCount = 0;

      for (const task of validatedTasks) {
        try {
          await createTaskMutation.mutateAsync({
            title: task.title,
            description: task.description || "",
            priority: task.priority || "medium",
            deadline: task.deadline || undefined,
            estimated_duration: task.estimated_duration || 60,
            category_id: task.category_id || undefined,
          });
          successCount++;
        } catch (error) {
          console.error("Failed to import task:", task.title, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        setImportStatus("success");
        setImportMessage(
          `Successfully imported ${successCount} tasks${failCount > 0 ? `, ${failCount} failed` : ""}`,
        );
        setImportData("");
        setValidatedTasks([]);

        toast({
          title: "Import Complete",
          description: `${successCount} tasks imported successfully`,
        });
      } else {
        setImportStatus("error");
        setImportMessage("Failed to import any tasks");
      }
    } catch (error) {
      setImportStatus("error");
      setImportMessage(
        "Import failed: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportData(content);
      setImportStatus("idle");
    };
    reader.readAsText(file);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Import/Export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            Import/Export Tasks
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export Tasks</TabsTrigger>
            <TabsTrigger value="import">Import Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Export Your Tasks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Export Format</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <Button
                      variant={exportFormat === "json" ? "default" : "outline"}
                      onClick={() => setExportFormat("json")}
                      className="flex flex-col h-auto p-3"
                    >
                      <FileJson className="h-6 w-6 mb-1" />
                      JSON
                    </Button>
                    <Button
                      variant={exportFormat === "csv" ? "default" : "outline"}
                      onClick={() => setExportFormat("csv")}
                      className="flex flex-col h-auto p-3"
                    >
                      <FileSpreadsheet className="h-6 w-6 mb-1" />
                      CSV
                    </Button>
                    <Button
                      variant={exportFormat === "ical" ? "default" : "outline"}
                      onClick={() => setExportFormat("ical")}
                      className="flex flex-col h-auto p-3"
                    >
                      <CalendarIcon className="h-6 w-6 mb-1" />
                      iCal
                    </Button>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Export Details:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {exportFormat === "json" && (
                      <>
                        <li>• Complete task data with all fields</li>
                        <li>• AI scores and metadata included</li>
                        <li>• Can be re-imported later</li>
                      </>
                    )}
                    {exportFormat === "csv" && (
                      <>
                        <li>• Spreadsheet-compatible format</li>
                        <li>• Easy to view and edit</li>
                        <li>• Compatible with Excel, Google Sheets</li>
                      </>
                    )}
                    {exportFormat === "ical" && (
                      <>
                        <li>• Calendar format for tasks with deadlines</li>
                        <li>• Import into calendar apps</li>
                        <li>• Time-blocking and scheduling</li>
                      </>
                    )}
                  </ul>
                </div>

                <Button
                  onClick={exportTasks}
                  className="w-full"
                  disabled={!tasks.length}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export {tasks.length} Tasks as {exportFormat.toUpperCase()}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Import Tasks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">Upload JSON File</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="import-data">Or Paste JSON Data</Label>
                  <textarea
                    id="import-data"
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    placeholder='[{"title": "Sample Task", "description": "Task description", "priority": "medium"}]'
                    className="w-full h-32 p-3 border rounded-md resize-none font-mono text-sm"
                  />
                </div>

                {importStatus !== "idle" && (
                  <Alert
                    variant={
                      importStatus === "error" ? "destructive" : "default"
                    }
                  >
                    {importStatus === "success" ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    <AlertDescription>{importMessage}</AlertDescription>
                  </Alert>
                )}

                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                  <h4 className="font-medium mb-2 text-blue-900 dark:text-blue-100">
                    Import Requirements:
                  </h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Valid JSON format required</li>
                    <li>• Each task must have a &quot;title&quot; field</li>
                    <li>
                      • Optional: description, priority, category, deadline
                    </li>
                    <li>• Priority values: low, medium, high, urgent</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={validateTasks}
                    className="w-full"
                    disabled={!importData.trim() || importStatus === "loading"}
                    variant="outline"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Validate & Preview Import
                  </Button>

                  {validatedTasks.length > 0 && (
                    <Button
                      onClick={actuallyImportTasks}
                      className="w-full"
                      disabled={importStatus === "loading"}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {importStatus === "loading"
                        ? "Importing..."
                        : `Import ${validatedTasks.length} Tasks`}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
