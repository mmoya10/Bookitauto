// src/hooks/useCalendarData.js
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchCalendars,
  fetchCategories,
  fetchStaff,
  fetchBusinessHours,
  fetchHolidays,
} from "../api/calendars";
import { fetchUsers } from "../api/users";
import { fetchProducts } from "../api/products";

export function useCalendarData() {
  const { data: calendars = [] } = useQuery({
    queryKey: ["calendars"],
    queryFn: () => fetchCalendars(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["calendar-categories"],
    queryFn: () => fetchCategories(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: () => fetchStaff(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: businessHours = [] } = useQuery({
    queryKey: ["business-hours"],
    queryFn: () => fetchBusinessHours(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: holidays = [] } = useQuery({
    queryKey: ["holidays"],
    queryFn: () => fetchHolidays(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => fetchProducts(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => fetchUsers(),
    staleTime: 5 * 60 * 1000,
  });

  const calMap = useMemo(
    () => Object.fromEntries(calendars.map((c) => [c.id, c.name])),
    [calendars]
  );
  const staffNameMap = useMemo(
    () => Object.fromEntries(staff.map((s) => [s.id, s.name])),
    [staff]
  );
  const staffColorMap = useMemo(
    () => Object.fromEntries(staff.map((s) => [s.id, s.color || "#64748b"])),
    [staff]
  );

  return {
    calendars,
    categories,
    staff,
    businessHours,
    holidays,
    users,
    products,
    calMap,
    staffNameMap,
    staffColorMap,
  };
}
