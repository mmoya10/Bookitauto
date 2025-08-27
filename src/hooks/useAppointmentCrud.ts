// src/hooks/useAppointmentCrud.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAppointment, updateAppointment, updateAppointmentDates } from "../api/calendars";

export function useAppointmentCrud() {
  const qc = useQueryClient();
  const createApt = useMutation({ mutationFn: createAppointment, onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }) });
  const updateApt = useMutation({ mutationFn: updateAppointment, onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }) });
  const moveApt   = useMutation({ mutationFn: updateAppointmentDates, onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }) });
  return { createApt, updateApt, moveApt };
}
