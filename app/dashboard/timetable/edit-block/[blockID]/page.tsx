import EditTimetableBlockForm from "@/app/ui/timetable/edittimetableblock";

export default async function EditBlockPage({
  params,
}: {
  params: Promise<{ blockID: string }>;
}) {
  const { blockID } = await params;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Edit Block - {blockID}</h1>
      <EditTimetableBlockForm blockID={blockID} />
    </div>
  );
}
