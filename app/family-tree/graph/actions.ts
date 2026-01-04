"use server";

import { createClient } from "@/lib/supabase/server";

export interface FamilyMemberNode {
  id: number;
  name: string;
  generation: number | null;
  sibling_order: number | null;
  father_id: number | null;
  gender: "男" | "女" | null;
  official_position: string | null;
  is_alive: boolean;
  spouse: string | null;
  remarks: string | null;
  birthday: string | null;
  death_date: string | null;
  residence_place: string | null;
}

export interface FetchGraphResult {
  data: FamilyMemberNode[];
  error: string | null;
}

export async function fetchAllFamilyMembers(): Promise<FetchGraphResult> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("family_members")
    .select("id, name, generation, sibling_order, father_id, gender, official_position, is_alive, spouse, remarks, birthday, death_date, residence_place")
    .order("generation", { ascending: true })
    .order("sibling_order", { ascending: true });

  if (error) {
    return { data: [], error: error.message };
  }

  return { data: data || [], error: null };
}
