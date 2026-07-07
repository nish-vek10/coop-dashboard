// src/types/rota.ts

export type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  payRate: number; // £ per hour, agreed rate keyed in when adding the employee
};

export type Shift = {
  start?: string; // "HH:MM"
  end?: string; // "HH:MM"
};

export type WeekRota = Record<string, Record<string, Shift>>;

const RotaTypes = {} as {
  Employee: Employee;
  Shift: Shift;
  WeekRota: WeekRota;
};

export default RotaTypes;
