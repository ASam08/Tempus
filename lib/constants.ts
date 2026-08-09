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

export const colourStyles: Record<string, string> = {
  red: "bg-red-600 focus:bg-red-700 dark:bg-red-600 dark:focus:bg-red-700 hover:bg-red-700 dark:hover:bg-red-700",
  blue: "bg-blue-600 focus:bg-blue-700 dark:bg-blue-600 dark:focus:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-700",
  green:
    "bg-green-600 focus:bg-green-700 dark:bg-green-600 dark:focus:bg-green-700 hover:bg-green-700 dark:hover:bg-green-700",
  yellow:
    "bg-yellow-600 focus:bg-yellow-700 dark:bg-yellow-600 dark:focus:bg-yellow-700 hover:bg-yellow-700 dark:hover:bg-yellow-700",
  orange:
    "bg-orange-600 focus:bg-orange-700 dark:bg-orange-600 dark:focus:bg-orange-700 hover:bg-orange-700 dark:hover:bg-orange-700",
  purple:
    "bg-purple-600 focus:bg-purple-700 dark:bg-purple-600 dark:focus:bg-purple-700 hover:bg-purple-700 dark:hover:bg-purple-700",
};
