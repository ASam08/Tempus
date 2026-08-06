"use client";

import { useState } from "react";
import { LucideEdit2, LucideTrash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { deleteTimetableSet } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function SetManageActions(timetable: {
  id: string;
  title: string;
  description: string | null;
}) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  function handleEdit() {
    router.push(`/dashboard/timetable/edit/${timetable.id}`);
  }

  async function handleDelete() {
    try {
      const { message } = await deleteTimetableSet(timetable.id);
      setIsDeleteDialogOpen(false);
      if (message) {
        toast.error(message, {
          position: "top-center",
          style: { backgroundColor: "red" },
        });
      } else {
        toast.success(`Timetable "${timetable.title}" deleted successfully.`, {
          position: "top-center",
          style: { backgroundColor: "forestgreen" },
        });
        router.push("/dashboard/timetable");
      }
    } catch (error) {
      console.error("Unexpected error deleting timetable set:", error);
      setIsDeleteDialogOpen(false);
      toast.error("Something went wrong. Please try again.", {
        position: "top-center",
        style: { backgroundColor: "red" },
      });
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <LucideEdit2
          className="size-5 cursor-pointer hover:text-blue-600"
          onClick={handleEdit}
        />
        <LucideTrash2
          className="size-5 cursor-pointer hover:text-blue-600"
          onClick={() => setIsDeleteDialogOpen(true)}
        />
      </div>
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the timetable "{timetable.title}"?
              <br />
              <br />
              <span className="text-destructive font-bold">
                This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
