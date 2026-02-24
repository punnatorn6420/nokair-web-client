"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SpamSummary = {
  total: number;
  success200: number;
  tooMany429: number;
  otherError: number;
  elapsedMs: number;
};

type RequestOutcome = {
  status: number;
  ok: boolean;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fireSingleRequest(): Promise<RequestOutcome> {
  try {
    const q = `spam-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const response = await fetch(`/api/mock-search?q=${encodeURIComponent(q)}`, {
      method: "GET",
      cache: "no-store",
    });

    return {
      status: response.status,
      ok: response.ok,
    };
  } catch {
    return {
      status: -1,
      ok: false,
    };
  }
}

export function SpamSimulationPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<SpamSummary | null>(null);

  const summaryText = useMemo(() => {
    if (!summary) {
      return "ยังไม่มีผลการทดสอบ";
    }

    return `สำเร็จ 200 = ${summary.success200}, โดนจำกัด 429 = ${summary.tooMany429}, อื่น ๆ/Network error = ${summary.otherError}, รวม ${summary.total} requests, ใช้เวลา ${summary.elapsedMs} ms`;
  }, [summary]);

  const runSequential = async (count: number) => {
    setIsLoading(true);
    setSummary(null);
    const startedAt = performance.now();

    let success200 = 0;
    let tooMany429 = 0;
    let otherError = 0;

    for (let i = 0; i < count; i += 1) {
      const outcome = await fireSingleRequest();
      if (outcome.status === 200) success200 += 1;
      else if (outcome.status === 429) tooMany429 += 1;
      else otherError += 1;

      await sleep(10);
    }

    const elapsedMs = Math.round(performance.now() - startedAt);
    setSummary({
      total: count,
      success200,
      tooMany429,
      otherError,
      elapsedMs,
    });
    setIsLoading(false);
  };

  const runParallel = async (count: number) => {
    setIsLoading(true);
    setSummary(null);
    const startedAt = performance.now();

    const outcomes = await Promise.all(
      Array.from({ length: count }, () => fireSingleRequest()),
    );

    const success200 = outcomes.filter((item) => item.status === 200).length;
    const tooMany429 = outcomes.filter((item) => item.status === 429).length;
    const otherError = outcomes.length - success200 - tooMany429;

    const elapsedMs = Math.round(performance.now() - startedAt);
    setSummary({
      total: count,
      success200,
      tooMany429,
      otherError,
      elapsedMs,
    });
    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Front-side Spam Simulation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p>
          ใช้จำลองการกดยิง request รัว ๆ จากฝั่งหน้าเว็บเท่านั้น โดยตัวป้องกันหลักยัง
          เป็น backend rate limit ที่ `/api/mock-search`.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => runSequential(1)} disabled={isLoading}>
            ยิง 1 request
          </Button>
          <Button onClick={() => runSequential(10)} disabled={isLoading} variant="outline">
            ยิง 10 requests sequential
          </Button>
          <Button onClick={() => runParallel(20)} disabled={isLoading} variant="outline">
            ยิง 20 requests parallel
          </Button>
        </div>

        {isLoading ? (
          <p className="text-zinc-700">กำลังยิง request... (ปุ่มถูก disable ชั่วคราว)</p>
        ) : (
          <p className="text-zinc-700">สถานะ: พร้อมทดสอบ</p>
        )}

        <div className="rounded-md bg-zinc-100 p-3 text-zinc-900">
          <p className="font-medium">สรุปผลล่าสุด</p>
          <p>{summaryText}</p>
        </div>
      </CardContent>
    </Card>
  );
}
