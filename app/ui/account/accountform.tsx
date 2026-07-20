"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User } from "better-auth";

export default function AccountForm({ user }: { user: User }) {
  return (
    <Tabs defaultValue="details">
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="details">
        <div className="max-w-96">
          <div className="gap-4 text-lg font-bold">Details</div>
          <Separator />
          <form className="mt-4 grid gap-3">
            <Field className="grid gap-3">
              <FieldLabel>Name</FieldLabel>
              <Input
                id="name"
                name="name"
                type="text"
                defaultValue={user.name}
              />
            </Field>
            <Field className="grid gap-3">
              <FieldLabel>Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user.email}
              />
            </Field>
            <div className="flex flex-row gap-4 py-4">
              <Button variant="outline">Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </div>
      </TabsContent>
      <TabsContent value="password">
        <div className="max-w-96">
          <div className="gap-4 text-lg font-bold">Password</div>
          <Separator />
          <form className="mt-4 grid gap-3">
            <Field className="grid gap-3">
              <FieldLabel>Password</FieldLabel>
              <Input id="password" name="password" type="password" />
            </Field>
            <Field className="grid gap-3">
              <FieldLabel>Confirm Password</FieldLabel>
              <Input
                id="confirm-password"
                name="confirm-password"
                type="password"
              />
            </Field>
            <div className="flex flex-row gap-4 py-4">
              <Button variant="outline">Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </div>
      </TabsContent>
    </Tabs>
  );
}
