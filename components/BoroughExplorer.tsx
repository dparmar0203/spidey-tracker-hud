"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getBoroughDetail, type BoroughDetail } from "@/app/actions";

type Borough = { name: string; count: number };

const PAGE_SIZE = 15;

export default function BoroughExplorer({ boroughs }: { boroughs: Borough[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState<BoroughDetail | null>(null);
  const [isPending, startTransition] = useTransition();
  const detailRef = useRef<HTMLDivElement>(null);

  const total = boroughs.find((b) => b.name === selected)?.count ?? 0;
  const maxPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);

  function handleSelect(borough: string) {
    setSelected(borough);
    setPage(0);
  }

  useEffect(() => {
    if (!selected) return;
    startTransition(async () => {
      const data = await getBoroughDetail(selected, page);
      setDetail(data);
    });
  }, [selected, page]);

  useEffect(() => {
    if (selected) {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selected]);

  return (
    <>
      <div className="relative grid grid-cols-2 sm:grid-cols-5 gap-4 max-w-4xl w-full">
        {boroughs.map(({ name, count }, i) => (
          <button
            key={name}
            type="button"
            onClick={() => handleSelect(name)}
            className="w-full rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <Card
              className={`bg-card text-center border-t-4 transition-transform hover:-translate-y-1 hover:shadow-lg ${
                i % 2 === 0
                  ? "border-t-primary hover:shadow-primary/30"
                  : "border-t-secondary hover:shadow-secondary/30"
              } ${selected === name ? "ring-2 ring-primary" : ""}`}
            >
              <CardHeader>
                <CardTitle className="text-sm text-zinc-400 font-medium tracking-wide uppercase">
                  {name.replace("_", " ")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-heading text-3xl tracking-wide">
                  {count.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      {selected && (
        <div ref={detailRef} className="relative w-full max-w-4xl mt-10 scroll-mt-10">
          <Card className="bg-card border-border/60 text-left">
            <CardHeader>
              <CardTitle className="font-heading text-2xl tracking-wide text-primary">
                {selected.replace("_", " ")} — Field Reports
              </CardTitle>
              <CardDescription>
                {isPending || !detail
                  ? "Pulling the tracker feed…"
                  : `Showing ${page * PAGE_SIZE + 1}–${
                      page * PAGE_SIZE + detail.sightings.length
                    } of ${total.toLocaleString()} · Avg. witnesses: ${detail.avgWitnessCount.toFixed(
                      1
                    )} · Verified: ${(detail.verifiedRate * 100).toFixed(0)}%`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isPending || !detail ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : detail.sightings.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No reports on file for this borough yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>District</TableHead>
                      <TableHead>Report Type</TableHead>
                      <TableHead>Witnesses</TableHead>
                      <TableHead>Coordinates</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.sightings.map((s) => (
                      <TableRow key={s.sighting_id}>
                        <TableCell className="text-muted-foreground">
                          {new Date(s.timestamp).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>{s.district.replace(/_/g, " ")}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="border-secondary/40 text-secondary capitalize"
                          >
                            {s.report_type.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {s.witness_count}
                          <span className="text-xs text-muted-foreground">
                            {" "}
                            ({s.unique_source_count} unique)
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                        </TableCell>
                        <TableCell>
                          {s.verification_status === "verified" ? (
                            <Badge
                              variant="outline"
                              className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                            >
                              verified
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-muted-foreground/30 text-muted-foreground capitalize"
                            >
                              {s.verification_status.replace(/_/g, " ")}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-4">
                <span className="text-xs text-muted-foreground">
                  Page {page + 1} of {maxPage + 1}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0 || isPending}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= maxPage || isPending}
                    onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
                  >
                    Next
                    <ChevronRight />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
