"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function EditTimetableBlockForm({
  blockID,
}: {
  blockID: string;
}) {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Edit Block - {blockID}</h1>
      <form>
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="blockID">Block ID</Label>
          <Input id="blockID" placeholder="Block ID" defaultValue={blockID} />
        </div>
        <Button type="submit" className="mt-4">
          Update Block
        </Button>
      </form>
    </div>
  );
}
