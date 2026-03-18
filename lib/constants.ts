export const dow: string[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const dowKeyValue: { key: string; label: string; dow: number }[] = [
  { key: "monday", label: "Monday", dow: 1 },
  { key: "tuesday", label: "Tuesday", dow: 2 },
  { key: "wednesday", label: "Wednesday", dow: 3 },
  { key: "thursday", label: "Thursday", dow: 4 },
  { key: "friday", label: "Friday", dow: 5 },
  { key: "saturday", label: "Saturday", dow: 6 },
  { key: "sunday", label: "Sunday", dow: 7 },
];

export const dowShortened: {
  key: string;
  label: string;
  mid: string;
  short: string;
  dow: number;
}[] = [
  { key: "monday", label: "Monday", mid: "Mon", short: "M", dow: 1 },
  { key: "tuesday", label: "Tuesday", mid: "Tue", short: "T", dow: 2 },
  { key: "wednesday", label: "Wednesday", mid: "Wed", short: "W", dow: 3 },
  { key: "thursday", label: "Thursday", mid: "Thu", short: "Th", dow: 4 },
  { key: "friday", label: "Friday", mid: "Fri", short: "F", dow: 5 },
  { key: "saturday", label: "Saturday", mid: "Sat", short: "S", dow: 6 },
  { key: "sunday", label: "Sunday", mid: "Sun", short: "Su", dow: 7 },
];
