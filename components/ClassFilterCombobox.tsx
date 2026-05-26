"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ClassFilterOption = {
  id: string;
  label: string;
  name: string;
  department?: string | null;
  grade?: string | null;
};

export function ClassFilterCombobox({ options, value }: { options: ClassFilterOption[]; value: string }) {
  const selectedOption = options.find((option) => option.id === value);
  const [query, setQuery] = useState(selectedOption?.label || "");
  const [selectedId, setSelectedId] = useState(selectedOption?.id || "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredOptions = useMemo(() => {
    if (!normalizedQuery) return options;
    return options.filter((option) =>
      [option.name, option.department, option.grade, option.label]
        .filter(Boolean)
        .some((part) => String(part).toLocaleLowerCase().startsWith(normalizedQuery))
    );
  }, [normalizedQuery, options]);

  useEffect(() => {
    inputRef.current?.setCustomValidity(
      normalizedQuery && !selectedId ? "请从下拉列表选择一个班级" : ""
    );
  }, [normalizedQuery, selectedId]);

  function selectOption(option?: ClassFilterOption) {
    setQuery(option?.label || "");
    setSelectedId(option?.id || "");
    setActiveIndex(-1);
    setOpen(false);
  }

  function handleInput(nextValue: string) {
    setQuery(nextValue);
    setSelectedId(options.find((option) => option.label === nextValue)?.id || "");
    setActiveIndex(-1);
    setOpen(true);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => Math.min(current + 1, filteredOptions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter" && open && activeIndex >= 0) {
      event.preventDefault();
      selectOption(filteredOptions[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div className="students-class-combobox">
      <label className="sr-only" htmlFor="student-class-filter">筛选班级</label>
      <input type="hidden" name="classId" value={selectedId} />
      <input
        ref={inputRef}
        id="student-class-filter"
        className="students-class-filter"
        value={query}
        placeholder="输入班级名称筛选"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls="student-class-options"
        autoComplete="off"
        onChange={(event) => handleInput(event.currentTarget.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={handleKeyDown}
      />
      {query && (
        <button type="button" className="students-class-clear" title="清除班级筛选" aria-label="清除班级筛选" onClick={() => selectOption()}>
          &times;
        </button>
      )}
      {open && (
        <div id="student-class-options" className="students-class-options" role="listbox" aria-label="班级建议">
          {!normalizedQuery && (
            <button type="button" className={!selectedId ? "active" : ""} onMouseDown={(event) => event.preventDefault()} onClick={() => selectOption()}>
              全部班级
            </button>
          )}
          {filteredOptions.map((option, index) => (
            <button
              key={option.id}
              type="button"
              role="option"
              aria-selected={selectedId === option.id}
              className={selectedId === option.id || activeIndex === index ? "active" : ""}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectOption(option)}
            >
              {option.label}
            </button>
          ))}
          {filteredOptions.length === 0 && <span>没有匹配的班级</span>}
        </div>
      )}
    </div>
  );
}
