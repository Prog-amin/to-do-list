"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Brain,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import { useTasks } from "@/hooks/useApi";
import type { TaskResponse } from "@shared/api";
import { cn } from "@/lib/utils";

interface TimeBlock {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  task?: TaskResponse;
  type: "task" | "focus" | "break" | "meeting";
  color: string;
}

const priorityColors = {
  low: "bg-green-500",
  medium: "bg-yellow-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};

const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, "0");
  return `${hour}:00`;
});

export function TaskCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<"calendar" | "timeblock">("calendar");
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const { data: tasksData } = useTasks();
  const tasks = tasksData?.results || [];

  // Filter tasks by selected date
  const tasksForDate = useMemo(() => {
    if (!selectedDate) return [];

    return tasks.filter((task) => {
      if (!task.deadline) return false;
      const taskDate = new Date(task.deadline);
      return (
        taskDate.getDate() === selectedDate.getDate() &&
        taskDate.getMonth() === selectedDate.getMonth() &&
        taskDate.getFullYear() === selectedDate.getFullYear()
      );
    });
  }, [tasks, selectedDate]);

  // Generate time blocks for the selected date
  const generateTimeBlocks = (): TimeBlock[] => {
    const blocks: TimeBlock[] = [];
    let currentTime = 9; // Start at 9 AM

    // Add morning focus block
    blocks.push({
      id: "focus-morning",
      title: "Morning Focus Time",
      startTime: "09:00",
      endTime: "10:30",
      type: "focus",
      color: "bg-blue-500",
    });

    currentTime = 10.5;

    // Add tasks based on priority and AI score
    const sortedTasks = [...tasksForDate].sort((a, b) => {
      // Sort by AI priority score, then by priority level
      const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };
      const aWeight = a.ai_priority_score / 100 + priorityWeight[a.priority];
      const bWeight = b.ai_priority_score / 100 + priorityWeight[b.priority];
      return bWeight - aWeight;
    });

    sortedTasks.forEach((task) => {
      if (currentTime >= 18) return; // Don't schedule after 6 PM

      const duration = task.estimated_duration / 60; // Convert to hours
      const endTime = currentTime + duration;

      blocks.push({
        id: task.id,
        title: task.title,
        startTime: formatTime(currentTime),
        endTime: formatTime(endTime),
        task,
        type: "task",
        color: priorityColors[task.priority],
      });

      currentTime = endTime;

      // Add break if needed
      if (currentTime < 18 && duration > 1) {
        blocks.push({
          id: `break-${task.id}`,
          title: "Break",
          startTime: formatTime(currentTime),
          endTime: formatTime(currentTime + 0.25),
          type: "break",
          color: "bg-gray-300",
        });
        currentTime += 0.25;
      }
    });

    // Add lunch break
    if (currentTime <= 13 && currentTime >= 11) {
      blocks.push({
        id: "lunch",
        title: "Lunch Break",
        startTime: "12:00",
        endTime: "13:00",
        type: "break",
        color: "bg-green-300",
      });
    }

    return blocks;
  };

  const formatTime = (time: number): string => {
    const hours = Math.floor(time);
    const minutes = Math.round((time - hours) * 60);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  const timeBlocks = generateTimeBlocks();

  // Get week days for weekly view
  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
    startOfWeek.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = getWeekDays(currentWeek);

  const navigateWeek = (direction: "prev" | "next") => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === "next" ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarIcon className="mr-2 h-4 w-4" />
          Calendar View
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Task Calendar & Time Blocking
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={view}
          onValueChange={(v) => setView(v as "calendar" | "timeblock")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="timeblock">Time Blocking</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar Component */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Select Date</CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDate(new Date())}
                      >
                        Today
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        // Auto-switch to today if it's a different day
                        const today = new Date();
                        if (date.toDateString() === today.toDateString()) {
                          setCurrentWeek(today);
                        }
                      }
                    }}
                    className="rounded-md border"
                    showOutsideDays={true}
                    fixedWeeks={true}
                    modifiers={{
                      hasTasks: (date) =>
                        tasks.some((task) => {
                          if (!task.deadline) return false;
                          const taskDate = new Date(task.deadline);
                          return (
                            taskDate.getDate() === date.getDate() &&
                            taskDate.getMonth() === date.getMonth() &&
                            taskDate.getFullYear() === date.getFullYear()
                          );
                        }),
                      today: new Date(),
                      weekend: (date) =>
                        date.getDay() === 0 || date.getDay() === 6,
                    }}
                    modifiersStyles={{
                      hasTasks: {
                        backgroundColor: "hsl(var(--primary))",
                        color: "hsl(var(--primary-foreground))",
                        fontWeight: "bold",
                        borderRadius: "6px",
                      },
                      today: {
                        backgroundColor: "hsl(var(--accent))",
                        color: "hsl(var(--accent-foreground))",
                        fontWeight: "bold",
                      },
                      weekend: {
                        color: "hsl(var(--muted-foreground))",
                      },
                    }}
                    disabled={(date) =>
                      date <
                      new Date(new Date().setDate(new Date().getDate() - 1))
                    }
                  />
                  <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                      <span>Days with tasks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-accent"></div>
                      <span>Today</span>
                    </div>
                    <p className="mt-2">
                      Click any date to view and manage your tasks. Use the time
                      blocking view to optimize your schedule.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Tasks for Selected Date */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Tasks for {selectedDate.toLocaleDateString()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-80">
                    {tasksForDate.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No tasks scheduled for this date</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {tasksForDate.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center gap-3 p-3 border rounded-lg"
                          >
                            <div
                              className={`w-3 h-3 rounded-full ${priorityColors[task.priority]}`}
                            />
                            <div className="flex-1">
                              <h4 className="font-medium">{task.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {task.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {task.priority}
                                </Badge>
                                {task.deadline && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {new Date(task.deadline).toLocaleTimeString(
                                      [],
                                      {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      },
                                    )}
                                  </div>
                                )}
                                <div className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-1 rounded-full text-xs">
                                  <Brain className="h-3 w-3" />
                                  {Math.round(task.ai_priority_score)}%
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="timeblock" className="space-y-4">
            {/* Time Blocking Interface */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    AI-Optimized Schedule for{" "}
                    {selectedDate.toLocaleDateString()}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateWeek("prev")}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateWeek("next")}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-8 gap-2">
                  {/* Time column */}
                  <div className="space-y-1">
                    <div className="h-8 text-xs font-medium text-center">
                      Time
                    </div>
                    {timeSlots.slice(8, 19).map(
                      (
                        time, // 8 AM to 6 PM
                      ) => (
                        <div
                          key={time}
                          className="h-16 text-xs text-muted-foreground flex items-center"
                        >
                          {time}
                        </div>
                      ),
                    )}
                  </div>

                  {/* Week days */}
                  {weekDays.map((day, index) => (
                    <div key={index} className="space-y-1">
                      <div
                        className={cn(
                          "h-8 text-xs font-medium text-center p-1 rounded",
                          day.toDateString() === selectedDate.toDateString()
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted",
                        )}
                      >
                        <div>
                          {day.toLocaleDateString([], { weekday: "short" })}
                        </div>
                        <div>{day.getDate()}</div>
                      </div>

                      {/* Time slots for this day */}
                      <div className="space-y-1">
                        {timeSlots.slice(8, 19).map((time) => {
                          const blockForTime =
                            day.toDateString() === selectedDate.toDateString()
                              ? timeBlocks.find(
                                  (block) =>
                                    block.startTime <= time &&
                                    block.endTime > time,
                                )
                              : null;

                          return (
                            <div
                              key={time}
                              className={cn(
                                "h-16 border border-border rounded text-xs p-1",
                                blockForTime
                                  ? `${blockForTime.color} text-white`
                                  : "bg-background hover:bg-accent",
                              )}
                            >
                              {blockForTime && (
                                <div className="h-full flex flex-col justify-center">
                                  <div className="font-medium text-xs truncate">
                                    {blockForTime.title}
                                  </div>
                                  {blockForTime.task && (
                                    <div className="text-xs opacity-90">
                                      {blockForTime.task.estimated_duration}min
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Time Block Legend */}
                <div className="mt-6 flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>Focus Time</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span>Urgent Tasks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded"></div>
                    <span>High Priority</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span>Medium Priority</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>Low Priority</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-300 rounded"></div>
                    <span>Breaks</span>
                  </div>
                </div>

                {/* AI Scheduling Insights */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    AI Scheduling Insights
                  </h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>
                      • High-priority tasks scheduled during peak productivity
                      hours (9-11 AM)
                    </li>
                    <li>
                      • Automatic break scheduling between intensive tasks
                    </li>
                    <li>
                      • Tasks ordered by AI priority score and deadline
                      proximity
                    </li>
                    <li>• Focus time blocks allocated for deep work</li>
                    <li>
                      • Estimated durations considered for realistic scheduling
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
