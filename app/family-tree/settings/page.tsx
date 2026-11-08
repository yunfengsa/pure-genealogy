"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRuntimeConfig } from "@/components/runtime-config-provider";

export default function FamilySettingsPage() {
  const { familySurname } = useRuntimeConfig();
  const [value, setValue] = useState(familySurname);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSave() {
    const surname = value.trim();
    if (!surname) {
      setStatus("error");
      setMessage("姓氏不能为空");
      return;
    }
    setStatus("saving");
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: "family_surname", value: surname }, { onConflict: "key" });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("saved");
      setMessage("已保存。刷新页面后，全站标题（约 10 秒内）即更新为「" + surname + "氏族谱」。");
    }
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-lg">
      <h1 className="text-2xl font-bold mb-6">家族设置</h1>
      <label className="block text-sm font-medium mb-2">家族姓氏</label>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={2}
        className="w-full rounded-md border px-3 py-2 text-base"
        placeholder="例如：王"
      />
      <p className="mt-2 text-xs text-muted-foreground">
        填写单字（如「王」），系统自动显示为「王氏族谱」。保存后请刷新页面。
      </p>
      <button
        type="button"
        onClick={onSave}
        disabled={status === "saving"}
        className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {status === "saving" ? "保存中…" : "保存"}
      </button>
      {message ? (
        <p className={"mt-3 text-sm " + (status === "error" ? "text-red-500" : "text-green-600")}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
