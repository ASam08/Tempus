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

export default function SetManageActions(timetable: {
  id: string;
  title: string;
  description: string | null;
}) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  function handleEdit() {
    console.log("Edit action triggered for timetable set:", timetable.title);
    router.push(`/dashboard/timetable/edit/${timetable.id}`);
  }

  function handleDelete() {
    console.log("Delete action triggered for timetable set:", timetable.title);
    deleteTimetableSet(timetable.id);
  }

  return (
    <div>
      <div className="flex gap-2">
        <LucideEdit2 className="hover:text-blue-600" onClick={handleEdit} />
        <LucideTrash2
          className="hover:text-blue-600"
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
