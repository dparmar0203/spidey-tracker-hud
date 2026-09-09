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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera, Video, Mic, TriangleAlert, ChevronLeft, ChevronRight } from "lucide-react";
import { getFilteredSightings, type FilteredSighting } from "@/app/actions";
import { BOROUGHS, REPORT_TYPES, VERIFICATION_STATUSES } from "@/lib/constants";

const PAGE_SIZE = 15;
const ALL = "all";

type Props = {
  initialSightings: FilteredSighting[];
  initialTotal: number;
};

export default function ReportsExplorer({ initialSightings, initialTotal }: Props) {
  const [borough, setBorough] = useState(ALL);
  const [reportType, setReportType] = useState(ALL);
  const [verification, setVerification] = useState(ALL);
  const [page, setPage] = useState(0);
  const [sightings, setSightings] = useState(initialSightings);
  const [total, setTotal] = useState(initialTotal);
  const [isPending, startTransition] = useTransition();
  const isFirstRender = useRef(true);

  const maxPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    startTransition(async () => {
      const data = await getFilteredSightings(
        {
          borough: borough === ALL ? undefined : borough,
          report_type: reportType === ALL ? undefined : reportType,
          verification_status: verification === ALL ? undefined : verification,
        },
        page
      );
      setSightings(data.sightings);
      setTotal(data.total);
    });
  }, [borough, reportType, verification, page]);

  function resetAnd(fn: () => void) {
    fn();
    setPage(0);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap gap-3">
        <Select value={borough} onValueChange={(v) => resetAnd(() => setBorough(v as string))}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Borough" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All boroughs</SelectItem>
            {BOROUGHS.map((b) => (
              <SelectItem key={b} value={b}>
                {b.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={reportType}
          onValueChange={(v) => resetAnd(() => setReportType(v as string))}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Report type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All report types</SelectItem>
            {REPORT_TYPES.map((r) => (
              <SelectItem key={r} value={r} className="capitalize">
                {r.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={verification}
          onValueChange={(v) => resetAnd(() => setVerification(v as string))}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {VERIFICATION_STATUSES.map((v) => (
              <SelectItem key={v} value={v} className="capitalize">
                {v.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-card border-border/60">
        <CardHeader>
          <CardTitle className="font-heading text-2xl tracking-wide text-primary">
            Field Reports
          </CardTitle>
          <CardDescription>
            {total.toLocaleString()} reports match these filters · Showing page{" "}
            {page + 1} of {maxPage + 1}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : sightings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No reports match these filters.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Borough</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Witnesses</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Evidence</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sightings.map((s) => (
                  <TableRow key={s.sighting_id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(s.timestamp).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>{s.borough.replace("_", " ")}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-secondary/40 text-secondary capitalize"
                      >
                        {s.report_type.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{s.witness_count}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {(s.tracker_confidence * 100).toFixed(0)}%
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        {s.photo_evidence && <Camera className="size-3.5" />}
                        {s.video_evidence && <Video className="size-3.5" />}
                        {s.audio_evidence && <Mic className="size-3.5" />}
                        {s.crime_nearby && (
                          <TriangleAlert className="size-3.5 text-primary" />
                        )}
                      </div>
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
  );
}
