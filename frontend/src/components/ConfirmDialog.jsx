import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogCancel, 
  AlertDialogAction,
  AlertDialogOverlay
} from "@/components/ui/alert-dialog";
import { AlertCircle, Trash2, ShieldAlert } from "lucide-react";

export function ConfirmDialog({ 
  open, 
  onOpenChange, 
  onConfirm, 
  title = "Are you sure?", 
  description = "This action cannot be undone.",
  cancelText = "Cancel",
  confirmText = "Continue",
  variant = "destructive"
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-zinc-800 text-white hover:bg-zinc-700 border-none transition-colors">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className={variant === "destructive" ? "bg-red-600 hover:bg-red-700 text-white transition-colors" : "bg-purple-600 hover:bg-purple-700 text-white transition-colors"}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
