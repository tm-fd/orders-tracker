"use client";

import { Button, Input, Spinner } from "@heroui/react";
import React, { useState, useEffect, useCallback } from "react";

interface Message {
  "@timestamp": string;
  level: string;
  message: string;
  key: string;
  meta?: Record<string, any>;
}
export default function LogViewer() {
  const PAGE_SIZE = 50;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [filter, setFilter] = useState("");
  const [level, setLevel] = useState("");
  const [logs, setLogs] = useState<Message[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  function formatMeta(obj: any): string {
    if (obj === null) return "null";
    if (typeof obj !== "object") {
      return typeof obj === "string" ? `'${obj}'` : String(obj);
    }
    const entries = Object.entries(obj).map(([k, v]) => {
      const val = formatMeta(v);
      return `${k}: ${val}`;
    });
    return `{ ${entries.join(", ")} }`;
  }

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const from = (page - 1) * pageSize;
      const params = new URLSearchParams({
        from: String(from),
        size: String(pageSize),
      });
      if (filter) params.set("q", filter);
      if (level) params.set("level", level);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_LOGS_API_URL}/logs?${params}`,
        {
          cache: "no-store",
        }
      );
      if (!res.ok) throw new Error(res.statusText);
      const { items, total } = (await res.json()) as {
        items: Message[];
        total: number;
      };

      setLogs(items);
      setTotalPages(Math.max(1, Math.ceil(total / pageSize)));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filter, level]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-gray-100 space-y-6">
      <h1 className="text-3xl font-bold">Log Viewer</h1>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-8">
        <Input
          size="md"
          className="flex-1 min-w-[200px]"
          placeholder="Search text"
          value={filter}
          onValueChange={setFilter}
        />
        <Input
          size="md"
          className="w-32"
          placeholder="Level"
          value={level}
          onValueChange={setLevel}
        />
        <Input
          size="md"
          className="w-24"
          placeholder="Page size"
          type="number"
          value={String(pageSize)}
          onValueChange={(v) => setPageSize(Number(v))}
        />
        <Button size="md" onPress={fetchData} isDisabled={loading}>
          {loading ? <Spinner size="sm" /> : "Reload"}
        </Button>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <div
          className="p-6 overflow-x-auto  bg-paperBgLight 
                  dark:bg-paperBgDark "
        >
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <table className="min-w-full table-fixed border-separate border-spacing-y-4">
              <thead
                className="
                  bg-headerBgLight text-headerTextLight
                  dark:bg-headerBgDark dark:text-headerTextDark
                "
              >
                <tr>
                  <th className="w-12 p-3 rounded-tl-2xl rounded-bl-2xl"></th>
                  <th className="p-3 text-left">Timestamp</th>
                  <th className="p-3 text-left">Level</th>
                  <th className="p-3 text-left">Message</th>
                  <th className="p-3 text-left rounded-tr-2xl rounded-br-2xl">
                    User ID
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <React.Fragment key={`${log["@timestamp"]}-${idx}`}>
                    <tr
                      onClick={() => toggle(`${log["@timestamp"]}-${idx}`)}
                      className={`
                        cursor-pointer hover:bg-gray-700
                        ${
                          expanded.has(`${log["@timestamp"]}-${idx}`)
                            ? "bg-gray-700"
                            : ""
                        }
                        ${idx % 2 === 1 ? "bg-gray-800" : ""}
                      `}
                    >
                      <td className="p-3 text-center">
                        {expanded.has(`${log["@timestamp"]}-${idx}`)
                          ? "–"
                          : "+"}
                      </td>
                      <td className="p-3">
                        {new Date(log["@timestamp"]).toLocaleString()}
                      </td>
                      <td className="p-3">{log.level}</td>
                      <td className="p-3 truncate max-w-[150px]">
                        {log.message}
                      </td>
                      <td className="p-3 truncate max-w-[150px]">{log.key}</td>
                    </tr>
                    {expanded.has(`${log["@timestamp"]}-${idx}`) && (
                      <tr>
                        <td colSpan={5} className="p-0">
                          <div className="m-0 p-4 text-sm text-gray-200 bg-gray-700">
                            <div>Level: {log.level}</div>
                            <div>User ID: {log.key}</div>
                            {log.meta && (
                              <div>
                                meta: <code>{formatMeta(log.meta)}</code>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end gap-4 mt-4">
        <Button
          onPress={() => setPage((p) => Math.max(1, p - 1))}
          isDisabled={page === 1 || loading}
        >
          Previous
        </Button>
        <span>
          Page {page} of {totalPages}
        </span>
        <Button
          onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
          isDisabled={page === totalPages || loading}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
