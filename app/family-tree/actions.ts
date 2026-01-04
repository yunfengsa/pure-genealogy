"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface FamilyMember {
  id: number;
  name: string;
  generation: number | null;
  sibling_order: number | null;
  father_id: number | null;
  father_name: string | null;
  gender: "男" | "女" | null;
  official_position: string | null;
  is_alive: boolean;
  spouse: string | null;
  remarks: string | null;
  birthday: string | null;
  death_date: string | null;
  residence_place: string | null;
  updated_at: string;
}

export interface FetchMembersResult {
  data: FamilyMember[];
  count: number;
  error: string | null;
}

export async function fetchFamilyMembers(
  page: number = 1,
  pageSize: number = 50,
  searchQuery: string = ""
): Promise<FetchMembersResult> {
  const supabase = await createClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("family_members")
    .select("*", { count: "exact" });

  if (searchQuery.trim()) {
    query = query.ilike("name", `%${searchQuery.trim()}%`);
  }

  const { data, count, error } = await query
    .order("generation", { ascending: true })
    .order("sibling_order", { ascending: true })
    .range(from, to);

  if (error) {
    return { data: [], count: 0, error: error.message };
  }

  // 获取所有父亲 ID
  const fatherIds = (data || [])
    .map((item) => item.father_id)
    .filter((id): id is number => id !== null);

  // 批量查询父亲姓名
  let fatherMap: Record<number, string> = {};
  if (fatherIds.length > 0) {
    const { data: fathers } = await supabase
      .from("family_members")
      .select("id, name")
      .in("id", fatherIds);

    if (fathers) {
      fatherMap = Object.fromEntries(fathers.map((f) => [f.id, f.name]));
    }
  }

  // 转换数据格式，添加 father_name
  const transformedData: FamilyMember[] = (data || []).map((item) => ({
    ...item,
    father_name: item.father_id ? fatherMap[item.father_id] || null : null,
  }));

  return { data: transformedData, count: count || 0, error: null };
}

export interface CreateMemberInput {
  name: string;
  generation?: number | null;
  sibling_order?: number | null;
  father_id?: number | null;
  gender?: "男" | "女" | null;
  official_position?: string | null;
  is_alive?: boolean;
  spouse?: string | null;
  remarks?: string | null;
  birthday?: string | null;
  death_date?: string | null;
  residence_place?: string | null;
}

export async function createFamilyMember(
  input: CreateMemberInput
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase.from("family_members").insert({
    name: input.name,
    generation: input.generation,
    sibling_order: input.sibling_order,
    father_id: input.father_id,
    gender: input.gender,
    official_position: input.official_position,
    is_alive: input.is_alive ?? true,
    spouse: input.spouse,
    remarks: input.remarks,
    birthday: input.birthday,
    death_date: input.death_date,
    residence_place: input.residence_place,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/family-tree");
  return { success: true, error: null };
}

export async function deleteFamilyMembers(
  ids: number[]
): Promise<{ success: boolean; error: string | null }> {
  if (ids.length === 0) {
    return { success: false, error: "没有选择要删除的成员" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("family_members")
    .delete()
    .in("id", ids);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/family-tree");
  return { success: true, error: null };
}

// 获取所有成员用于父亲选择下拉框
export async function fetchAllMembersForSelect(): Promise<
  { id: number; name: string; generation: number | null }[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("family_members")
    .select("id, name, generation")
    .order("generation", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching members for select:", error);
    return [];
  }

  return data || [];
}

export interface UpdateMemberInput extends CreateMemberInput {
  id: number;
}

// 根据 ID 获取单个成员
export async function fetchMemberById(
  id: number
): Promise<FamilyMember | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("family_members")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("Error fetching member by id:", error);
    return null;
  }

  // 如果有父亲ID，查询父亲姓名
  let father_name: string | null = null;
  if (data.father_id) {
    const { data: father } = await supabase
      .from("family_members")
      .select("name")
      .eq("id", data.father_id)
      .single();
    father_name = father?.name || null;
  }

  return {
    ...data,
    father_name,
  } as FamilyMember;
}

export async function updateFamilyMember(
  input: UpdateMemberInput
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("family_members")
    .update({
      name: input.name,
      generation: input.generation,
      sibling_order: input.sibling_order,
      father_id: input.father_id,
      gender: input.gender,
      official_position: input.official_position,
      is_alive: input.is_alive ?? true,
      spouse: input.spouse,
      remarks: input.remarks,
      birthday: input.birthday,
      death_date: input.death_date,
      residence_place: input.residence_place,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/family-tree");
  return { success: true, error: null };
}

export interface ImportMemberInput {
  name: string;
  generation?: number | null;
  sibling_order?: number | null;
  father_name?: string | null; // 导入时使用姓名匹配
  gender?: "男" | "女" | null;
  official_position?: string | null;
  is_alive?: boolean;
  spouse?: string | null;
  remarks?: string | null;
  birthday?: string | null;
  residence_place?: string | null;
}

export async function batchCreateFamilyMembers(
  members: ImportMemberInput[]
): Promise<{ success: boolean; count: number; error: string | null }> {
  const supabase = await createClient();

  // 1. 提取所有不为空的父亲姓名
  const fatherNames = Array.from(
    new Set(
      members
        .map((m) => m.father_name?.trim())
        .filter((n): n is string => !!n)
    )
  );

  // 2. 批量查找父亲 ID
  const fatherMap: Record<string, number> = {};
  if (fatherNames.length > 0) {
    const { data: foundFathers } = await supabase
      .from("family_members")
      .select("id, name")
      .in("name", fatherNames);

    if (foundFathers) {
      foundFathers.forEach((f) => {
        // 注意：如果有重名，这里会覆盖，简单起见取最后一个。
        // 实际场景可能需要更复杂的匹配逻辑（如结合世代）
        fatherMap[f.name] = f.id;
      });
    }
  }

  // 3. 构建插入数据
  const insertPayload = members.map((m) => {
    let father_id: number | null = null;
    if (m.father_name && fatherMap[m.father_name.trim()]) {
      father_id = fatherMap[m.father_name.trim()];
    }

    return {
      name: m.name,
      generation: m.generation,
      sibling_order: m.sibling_order,
      father_id: father_id,
      gender: m.gender,
      official_position: m.official_position,
      is_alive: m.is_alive ?? true,
      spouse: m.spouse,
      remarks: m.remarks,
      birthday: m.birthday,
      residence_place: m.residence_place,
    };
  });

  // 4. 批量插入
  const { error } = await supabase.from("family_members").insert(insertPayload);

  if (error) {
    return { success: false, count: 0, error: error.message };
  }

  revalidatePath("/family-tree");
  return { success: true, count: members.length, error: null };
}

export async function fetchMembersForTimeline(): Promise<
  { id: number; name: string; birthday: string | null; death_date: string | null; generation: number | null }[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("family_members")
    .select("id, name, birthday, death_date, generation")
    .order("birthday", { ascending: true });

  if (error) {
    console.error("Error fetching timeline data:", error);
    return [];
  }

  return data || [];
}
