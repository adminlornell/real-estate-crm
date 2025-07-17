"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Plus, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  User,
  Phone,
  Mail,
  Home,
  FileText,
  MessageSquare,
  MoreHorizontal
} from "lucide-react"

interface Task {
  id: string
  title: string
  description?: string
  priority: "low" | "medium" | "high"
  type: "call" | "email" | "meeting" | "showing" | "follow_up" | "document" | "other"
  status: "todo" | "in_progress" | "review" | "done"
  assignee?: {
    id: string
    name: string
    avatar?: string
  }
  client?: {
    id: string
    name: string
  }
  property?: {
    id: string
    title: string
  }
  due_date?: string
  created_at: string
  updated_at: string
}

interface TaskKanbanProps {
  tasks: Task[]
  onTaskCreate?: (task: Omit<Task, "id" | "created_at" | "updated_at">) => void
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void
  onTaskDelete?: (taskId: string) => void
  onTaskMove?: (taskId: string, newStatus: Task["status"]) => void
}

export function TaskKanban({ 
  tasks, 
  onTaskCreate, 
  onTaskUpdate, 
  onTaskDelete, 
  onTaskMove 
}: TaskKanbanProps) {
  const [newTaskDialog, setNewTaskDialog] = useState(false)
  const [draggedTask, setDraggedTask] = useState<string | null>(null)

  const columns = [
    { id: "todo", title: "To Do", color: "bg-slate-100" },
    { id: "in_progress", title: "In Progress", color: "bg-blue-100" },
    { id: "review", title: "Review", color: "bg-yellow-100" },
    { id: "done", title: "Done", color: "bg-green-100" }
  ] as const

  const getTasksByStatus = (status: Task["status"]) => {
    return tasks.filter(task => task.status === status)
  }

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityIcon = (priority: Task["priority"]) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="h-3 w-3" />
      case "medium":
        return <Clock className="h-3 w-3" />
      case "low":
        return <CheckCircle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const getTypeIcon = (type: Task["type"]) => {
    switch (type) {
      case "call":
        return <Phone className="h-3 w-3" />
      case "email":
        return <Mail className="h-3 w-3" />
      case "meeting":
        return <User className="h-3 w-3" />
      case "showing":
        return <Home className="h-3 w-3" />
      case "follow_up":
        return <MessageSquare className="h-3 w-3" />
      case "document":
        return <FileText className="h-3 w-3" />
      default:
        return <Calendar className="h-3 w-3" />
    }
  }

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, newStatus: Task["status"]) => {
    e.preventDefault()
    if (draggedTask && onTaskMove) {
      onTaskMove(draggedTask, newStatus)
    }
    setDraggedTask(null)
  }

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  const TaskCard = ({ task }: { task: Task }) => (
    <Card 
      className={`mb-3 cursor-move hover:shadow-md transition-shadow ${
        draggedTask === task.id ? "opacity-50" : ""
      } ${isOverdue(task.due_date) ? "border-red-200" : ""}`}
      draggable
      onDragStart={(e) => handleDragStart(e, task.id)}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-1">
            {getTypeIcon(task.type)}
            <Badge variant="outline" className={getPriorityColor(task.priority)}>
              {getPriorityIcon(task.priority)}
              <span className="ml-1 capitalize">{task.priority}</span>
            </Badge>
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>
        
        <h4 className="font-medium text-sm mb-1 line-clamp-2">{task.title}</h4>
        
        {task.description && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {task.description}
          </p>
        )}

        {(task.client || task.property) && (
          <div className="text-xs text-muted-foreground mb-2">
            {task.client && <div>Client: {task.client.name}</div>}
            {task.property && <div>Property: {task.property.title}</div>}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {task.assignee && (
              <Avatar className="h-5 w-5">
                <AvatarImage src={task.assignee.avatar} />
                <AvatarFallback className="text-xs">
                  {task.assignee.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            )}
            {task.due_date && (
              <div className={`flex items-center gap-1 text-xs ${
                isOverdue(task.due_date) ? "text-red-600" : "text-muted-foreground"
              }`}>
                <Calendar className="h-3 w-3" />
                {new Date(task.due_date).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const CreateTaskDialog = () => (
    <Dialog open={newTaskDialog} onOpenChange={setNewTaskDialog}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task to your workflow
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="Enter task title..." />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Enter task description..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="showing">Showing</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="due_date">Due Date</Label>
            <Input id="due_date" type="datetime-local" />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setNewTaskDialog(false)}>
            Cancel
          </Button>
          <Button onClick={() => setNewTaskDialog(false)}>
            Create Task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Task Board</h2>
        <Button onClick={() => setNewTaskDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id)
          return (
            <div key={column.id} className="space-y-3">
              <Card className={`${column.color} border-0`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{column.title}</CardTitle>
                    <Badge variant="secondary" className="bg-white">
                      {columnTasks.length}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              <div
                className="min-h-[400px] p-2 rounded-lg border-2 border-dashed border-gray-200 transition-colors"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <ScrollArea className="h-full">
                  {columnTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                  
                  {columnTasks.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No tasks in {column.title.toLowerCase()}</p>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          )
        })}
      </div>

      <CreateTaskDialog />
    </div>
  )
}