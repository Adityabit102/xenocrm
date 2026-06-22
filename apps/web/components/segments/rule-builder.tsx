import * as React from "react";
import { Plus, X } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export interface FilterCondition {
  field: "recency_days" | "frequency" | "monetary" | "city" | "gender" | "rfm_tier" | "category" | "tier";
  operator: "lt" | "gt" | "eq" | "gte" | "lte" | "in" | "contains" | "is" | "is not" | "is one of" | "greater than" | "less than" | "between" | "equals";
  value: any;
}

export interface SegmentFilterRules {
  logic: "AND" | "OR";
  conditions: FilterCondition[];
}

interface RuleBuilderProps {
  value: SegmentFilterRules;
  onChange: (value: SegmentFilterRules) => void;
}

const DIMENSIONS = [
  { value: "city", label: "City" },
  { value: "gender", label: "Gender" },
  { value: "rfm_tier", label: "RFM Tier" },
  { value: "monetary", label: "Spend (₹)" },
  { value: "frequency", label: "Order Count" },
  { value: "recency_days", label: "Days Since Last Order" },
  { value: "category", label: "Category" },
  { value: "tier", label: "Tier" },
];

const GENDER_OPTIONS = [{ value: "male", label: "Male" }, { value: "female", label: "Female" }];
const CATEGORY_OPTIONS = [
  { value: "Womenswear", label: "Womenswear" }, { value: "Menswear", label: "Menswear" },
  { value: "Footwear", label: "Footwear" }, { value: "Accessories", label: "Accessories" },
  { value: "Beauty", label: "Beauty" }, { value: "Home Decor", label: "Home Decor" },
  { value: "Sportswear", label: "Sportswear" },
];
const RFM_OPTIONS = [
  { value: "champion", label: "Champions" }, { value: "loyal", label: "Loyal Shoppers" },
  { value: "promising", label: "Promising" }, { value: "at_risk", label: "At Risk" },
  { value: "lapsed", label: "Lapsed" }, { value: "new", label: "New Buyers" },
  { value: "general", label: "General" },
];
const TIER_OPTIONS = [
  { value: "gold", label: "Gold" }, { value: "silver", label: "Silver" }, { value: "bronze", label: "Bronze" },
];

const inputStyle: React.CSSProperties = {
  background: "#FBF7EC", border: "1px solid #D8CCB6", borderRadius: 7,
  padding: "7px 10px", fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem",
  color: "#38322E", outline: "none", transition: "border-color 0.15s", boxSizing: "border-box" as const,
};

export function RuleBuilder({ value, onChange }: RuleBuilderProps) {
  const conditions = value?.conditions || [];
  const logic = value?.logic || "AND";

  const getOperatorsForField = (field: string) => {
    switch (field) {
      case "city":
        return [{ value: "is", label: "is" }, { value: "is not", label: "is not" }, { value: "is one of", label: "is one of" }];
      case "monetary": case "frequency": case "recency_days":
        return [{ value: "greater than", label: "greater than" }, { value: "less than", label: "less than" }, { value: "between", label: "between" }, { value: "equals", label: "equals" }];
      default:
        return [{ value: "is", label: "is" }, { value: "is one of", label: "is one of" }];
    }
  };

  const getDefaultsForField = (field: string): { operator: any; value: any } => {
    switch (field) {
      case "city": return { operator: "is", value: "Mumbai" };
      case "gender": return { operator: "is", value: "male" };
      case "rfm_tier": return { operator: "is", value: "champion" };
      case "tier": return { operator: "is", value: "gold" };
      case "category": return { operator: "is", value: "Womenswear" };
      case "monetary": return { operator: "greater than", value: 5000 };
      case "frequency": return { operator: "greater than", value: 1 };
      case "recency_days": return { operator: "less than", value: 30 };
      default: return { operator: "is", value: "" };
    }
  };

  const updateLogic = (newLogic: "AND" | "OR") => onChange({ ...value, logic: newLogic });

  const addCondition = () => {
    const defaults = getDefaultsForField("city");
    onChange({ ...value, conditions: [...conditions, { field: "city", operator: defaults.operator, value: defaults.value }] });
  };

  const removeCondition = (idx: number) => {
    const updated = [...conditions];
    updated.splice(idx, 1);
    onChange({ ...value, conditions: updated });
  };

  const updateCondition = (idx: number, updates: Partial<FilterCondition>) => {
    const updated = [...conditions];
    const current = updated[idx];

    if (updates.field && updates.field !== current.field) {
      const defaults = getDefaultsForField(updates.field);
      updated[idx] = { field: updates.field as any, operator: defaults.operator, value: defaults.value };
    } else {
      let val = updates.value !== undefined ? updates.value : current.value;
      const op = updates.operator !== undefined ? updates.operator : current.operator;
      const field = current.field;

      if (op === "between" && !Array.isArray(val)) val = [0, 100];
      else if (op !== "between" && Array.isArray(val)) val = val[0] ?? "";
      if (op === "is one of" && typeof val === "string") val = val.split(",").map((s: string) => s.trim()).filter(Boolean);
      else if (op !== "is one of" && Array.isArray(val) && op !== "between") val = val.join(", ");
      if (["monetary", "frequency", "recency_days"].includes(field) && op !== "between" && updates.value !== undefined && updates.value !== "") {
        const num = Number(updates.value);
        if (!isNaN(num)) val = num;
      }

      updated[idx] = { ...current, ...updates, value: val };
    }

    onChange({ ...value, conditions: updated });
  };

  const renderValueInput = (cond: FilterCondition, idx: number) => {
    const { field, operator, value: val } = cond;

    if (operator === "between") {
      const minVal = Array.isArray(val) ? val[0] ?? "" : "";
      const maxVal = Array.isArray(val) ? val[1] ?? "" : "";
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          <input type="number" placeholder="Min" value={minVal}
            onChange={e => updateCondition(idx, { value: [e.target.value === "" ? "" : Number(e.target.value), maxVal] })}
            style={{ ...inputStyle, width: 80 }}
            onFocus={e => (e.target.style.borderColor = "#3E8A9E")} onBlur={e => (e.target.style.borderColor = "#D8CCB6")} />
          <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", color: "#8A7F76" }}>and</span>
          <input type="number" placeholder="Max" value={maxVal}
            onChange={e => updateCondition(idx, { value: [minVal, e.target.value === "" ? "" : Number(e.target.value)] })}
            style={{ ...inputStyle, width: 80 }}
            onFocus={e => (e.target.style.borderColor = "#3E8A9E")} onBlur={e => (e.target.style.borderColor = "#D8CCB6")} />
        </div>
      );
    }

    if (operator === "is one of") {
      const displayVal = Array.isArray(val) ? val.join(", ") : val ?? "";
      return (
        <input type="text" placeholder="e.g. Mumbai, Delhi, Bangalore" value={displayVal}
          onChange={e => updateCondition(idx, { value: e.target.value })}
          style={{ ...inputStyle, flex: 1, minWidth: 160 }}
          onFocus={e => (e.target.style.borderColor = "#3E8A9E")} onBlur={e => (e.target.style.borderColor = "#D8CCB6")} />
      );
    }

    const selectStyles = { flex: 1, minWidth: 140 };
    switch (field) {
      case "gender":
        return (
          <Select value={val} onValueChange={v => updateCondition(idx, { value: v })}>
            <SelectTrigger style={{ ...inputStyle, ...selectStyles }}><SelectValue /></SelectTrigger>
            <SelectContent>{GENDER_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        );
      case "category":
        return (
          <Select value={val} onValueChange={v => updateCondition(idx, { value: v })}>
            <SelectTrigger style={{ ...inputStyle, ...selectStyles }}><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        );
      case "rfm_tier":
        return (
          <Select value={val} onValueChange={v => updateCondition(idx, { value: v })}>
            <SelectTrigger style={{ ...inputStyle, ...selectStyles }}><SelectValue /></SelectTrigger>
            <SelectContent>{RFM_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        );
      case "tier":
        return (
          <Select value={val} onValueChange={v => updateCondition(idx, { value: v })}>
            <SelectTrigger style={{ ...inputStyle, ...selectStyles }}><SelectValue /></SelectTrigger>
            <SelectContent>{TIER_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        );
      case "monetary": case "frequency": case "recency_days":
        return (
          <input type="number" placeholder="Value" value={val ?? ""}
            onChange={e => updateCondition(idx, { value: e.target.value === "" ? "" : Number(e.target.value) })}
            style={{ ...inputStyle, flex: 1, minWidth: 100 }}
            onFocus={e => (e.target.style.borderColor = "#3E8A9E")} onBlur={e => (e.target.style.borderColor = "#D8CCB6")} />
        );
      default:
        return (
          <input type="text" placeholder="e.g. Mumbai" value={val ?? ""}
            onChange={e => updateCondition(idx, { value: e.target.value })}
            style={{ ...inputStyle, flex: 1, minWidth: 140 }}
            onFocus={e => (e.target.style.borderColor = "#3E8A9E")} onBlur={e => (e.target.style.borderColor = "#D8CCB6")} />
        );
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, fontFamily: "DM Sans,sans-serif" }}>

      {}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px solid #E5DBC9" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", fontWeight: 600, color: "#38322E" }}>Match conditions:</span>
          <div style={{ display: "flex", background: "rgba(56, 50, 46,0.03)", border: "1px solid #E5DBC9", borderRadius: 8, padding: 3, gap: 3 }}>
            {(["AND", "OR"] as const).map(l => (
              <button key={l} type="button" onClick={() => updateLogic(l)}
                style={{ padding: "4px 12px", borderRadius: 6, border: logic === l ? "1px solid #D8CCB6" : "1px solid transparent", background: logic === l ? "#FFFFFF" : "transparent", color: logic === l ? "#2C6A7B" : "#8A7F76", fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
                {l === "AND" ? "All (AND)" : "Any (OR)"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conditions */}
      {conditions.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "28px 16px", border: "2px dashed #D8CCB6", borderRadius: 10, textAlign: "center", background: "rgba(56, 50, 46,0.02)", gap: 8 }}>
          <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.82rem", color: "#8A7F76", margin: 0 }}>No active filter rules.</p>
          <p style={{ fontFamily: "DM Sans,sans-serif", fontSize: "0.72rem", color: "#C9BFB0", margin: 0 }}>Add a condition to filter your customer audience segment.</p>
          <button type="button" onClick={addCondition}
            style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8, padding: "7px 14px", background: "rgba(56, 50, 46,0.04)", border: "1px solid #D8CCB6", borderRadius: 8, color: "#38322E", fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.borderColor = "#3E8A9E")}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.borderColor = "#D8CCB6")}>
            <Plus style={{ width: 13, height: 13 }} /> Add Condition
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {conditions.map((cond, idx) => {
            const operators = getOperatorsForField(cond.field);
            return (
              <div key={idx} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, padding: "10px 12px", background: "rgba(56, 50, 46,0.02)", border: "1px solid #E5DBC9", borderRadius: 10 }}>
                {}
                <Select value={cond.field} onValueChange={v => updateCondition(idx, { field: v as any })}>
                  <SelectTrigger style={{ ...inputStyle, width: 170 }}><SelectValue /></SelectTrigger>
                  <SelectContent>{DIMENSIONS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                </Select>

                {}
                <Select value={cond.operator} onValueChange={v => updateCondition(idx, { operator: v as any })}>
                  <SelectTrigger style={{ ...inputStyle, width: 150 }}><SelectValue /></SelectTrigger>
                  <SelectContent>{operators.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>

                {}
                <div style={{ flex: 1, minWidth: 130, display: "flex", alignItems: "center" }}>
                  {renderValueInput(cond, idx)}
                </div>

                {/* Remove */}
                <button type="button" onClick={() => removeCondition(idx)}
                  style={{ width: 32, height: 32, borderRadius: 6, background: "none", border: "none", color: "#C9BFB0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s", flexShrink: 0 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(204, 107, 107,0.08)"; (e.currentTarget as HTMLButtonElement).style.color = "#CC6B6B"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "#C9BFB0"; }}>
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>
            );
          })}

          {}
          <button type="button" onClick={addCondition}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", background: "transparent", border: "1px dashed #D8CCB6", borderRadius: 8, color: "#8A7F76", fontFamily: "DM Sans,sans-serif", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", marginTop: 4, transition: "all 0.15s", width: "100%" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#3E8A9E"; (e.currentTarget as HTMLButtonElement).style.color = "#2C6A7B"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#D8CCB6"; (e.currentTarget as HTMLButtonElement).style.color = "#8A7F76"; }}>
            <Plus style={{ width: 13, height: 13 }} /> + Add Condition
          </button>
        </div>
      )}
    </div>
  );
}
