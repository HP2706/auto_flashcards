import { listAlgorithms } from "@/algorithms";

export function GET() {
  return Response.json({ algorithms: listAlgorithms() });
}
