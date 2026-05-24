"use client";

import { THEME_LABELS } from "@/lib/game/config";
import type { ThemeKey } from "@/lib/game/types";
import { Palette } from "lucide-react";

interface ThemePanelProps {
  value: ThemeKey;
  onChange: (theme: ThemeKey) => void;
}

const themes = Object.keys(THEME_LABELS) as ThemeKey[];

export function ThemePanel({ value, onChange }: ThemePanelProps) {
  return (
    <div className="control-section">
      <div className="control-heading">
        <Palette size={17} />
        Theme
      </div>
      <div className="grid grid-cols-3 gap-2">
        {themes.map((theme) => (
          <button
            key={theme}
            type="button"
            className={`control-pill ${value === theme ? "control-pill-active" : ""}`}
            onClick={() => onChange(theme)}
          >
            {THEME_LABELS[theme]}
          </button>
        ))}
      </div>
    </div>
  );
}
