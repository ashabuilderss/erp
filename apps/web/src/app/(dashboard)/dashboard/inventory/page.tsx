"use client";

import { useState } from "react";
import { useSites, useInventory } from "@/hooks/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Package } from "lucide-react";
import { TableSkeleton } from "@/components/ui/skeleton-variants";
import { EmptyState } from "@/components/shared/empty-state";
import { format } from "date-fns";

export default function InventoryPage() {
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const { data: sites } = useSites();
  const { data: inventory, isLoading } = useInventory(selectedSiteId ? { siteId: selectedSiteId } : {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Inventory by Site</h2>
          <p className="text-sm text-muted-foreground">View material inventory filtered by construction site</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-72">
          <Select value={selectedSiteId || undefined} onValueChange={(v) => setSelectedSiteId(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Select a site" />
            </SelectTrigger>
            <SelectContent>
              {sites?.data?.map((site) => (
                <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedSiteId && (
          <Badge variant="secondary" className="cursor-pointer" onClick={() => setSelectedSiteId("")}>
            Clear filter
          </Badge>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={5} columns={6} />
          ) : !selectedSiteId ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mb-3" />
              <p className="font-medium">Select a site to view inventory</p>
            </div>
          ) : inventory && inventory.length > 0 ? (
            <div className="relative w-full overflow-x-auto">
              <table className="w-full caption-bottom text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Material</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Category</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Unit</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Qty on Hand</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Site</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => (
                    <tr key={item.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle font-medium">{item.material?.name ?? item.materialId}</td>
                      <td className="p-4 align-middle">{item.material?.category ?? "—"}</td>
                      <td className="p-4 align-middle">{item.material?.unit ?? "—"}</td>
                      <td className="p-4 align-middle">
                        <Badge variant="outline" className="font-mono">{item.quantityOnHand}</Badge>
                      </td>
                      <td className="p-4 align-middle">{item.site?.name ?? item.siteId}</td>
                      <td className="p-4 align-middle text-muted-foreground">
                        {format(new Date(item.lastUpdated), "MMM d, yyyy h:mm a")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
<EmptyState icon={<Package className="h-12 w-12" />} title="No inventory found for this site" description="Inventory records will appear here once added" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
