"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type HistoryItem = {
  _id: string
  userId: string
  originalText: string
  translatedText: string
  createdAt: string
}

type TranslationHistoryProps = {
  onSelect: (item: HistoryItem) => void
}

export function TranslationHistory({ onSelect }: TranslationHistoryProps) {
  const { token } = useAuth()
  const { toast } = useToast()
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchHistory = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch history")
      }

      const data = await response.json()
      setHistory(data)
    } catch (error) {
      console.error("Error fetching history:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load translation history",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [token])

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/history/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete history item")
      }

      setHistory((prev) => prev.filter((item) => item._id !== id))
      toast({
        title: "Success",
        description: "Translation history item deleted",
      })
    } catch (error) {
      console.error("Error deleting history item:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete history item",
      })
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-center text-muted-foreground">
        <p>No translation history yet</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-[calc(100vh-10rem)] pr-4">
      <div className="space-y-4 mt-4">
        {history.map((item) => (
          <div key={item._id} className="rounded-lg border p-3 hover:bg-accent/50 transition-colors relative group">
            <div className="mb-2 line-clamp-2 font-medium" onClick={() => onSelect(item)}>
              {item.originalText}
            </div>
            <div className="line-clamp-2 text-sm text-muted-foreground" onClick={() => onSelect(item)}>
              {item.translatedText}
            </div>
            <div className="mt-2 text-xs text-muted-foreground flex justify-between items-center">
              <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
              <AlertDialog open={deleteId === item._id} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setDeleteId(item._id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Translation History</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this translation history item? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(item._id)}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
