/**
 * Thứ tự học: kỹ năng nền trước, rồi học ngay các kỹ năng xây trên nó (Java → Spring → Kafka, rồi SQL → Oracle…).
 * Không bao giờ đặt một kỹ năng trước điều kiện tiên quyết của nó, kể cả khi sequence_order của BE bị lệch.
 */
export function orderLearningNodes<T extends { id: string; order: number; prerequisiteIds: string[] }>(nodes: T[]): T[] {
  const byOrder = nodes.map((node, index) => ({ node, index })).sort((a, b) => a.node.order - b.node.order || a.index - b.index);
  const known = new Set(byOrder.map(({ node }) => node.id).filter(Boolean));
  const placedIds = new Set<string>();
  const placed = new Set<number>();
  const result: T[] = [];
  const ready = (node: T) => node.prerequisiteIds.every((id) => !known.has(id) || placedIds.has(id));
  const place = (entry: { node: T; index: number }) => {
    placed.add(entry.index);
    if (entry.node.id) placedIds.add(entry.node.id);
    result.push(entry.node);
    if (!entry.node.id) return;
    for (const next of byOrder) {
      if (!placed.has(next.index) && next.node.prerequisiteIds.includes(entry.node.id) && ready(next.node)) place(next);
    }
  };
  let progressed = true;
  while (result.length < byOrder.length && progressed) {
    progressed = false;
    for (const entry of byOrder) {
      if (!placed.has(entry.index) && ready(entry.node)) {
        place(entry);
        progressed = true;
      }
    }
  }
  // Vòng phụ thuộc (dữ liệu lỗi): giữ nguyên thứ tự còn lại thay vì ẩn kỹ năng.
  byOrder.forEach((entry) => !placed.has(entry.index) && result.push(entry.node));
  return result.map((node, index) => ({ ...node, order: index + 1 }));
}
