export type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  contractedMinutes: number;
};

export type Shift = {
  start?: string; // "HH:MM"
  end?: string;   // "HH:MM"
  breakMins?: number;
};

export type WeekRota = Record<string, Record<string, Shift>>;

const RotaTypes = {} as {
  Employee: Employee;
  Shift: Shift;
  WeekRota: WeekRota;
};

export default RotaTypes;
