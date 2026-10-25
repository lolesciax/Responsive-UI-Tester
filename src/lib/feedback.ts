import { toast } from "sonner";
import { useUI } from "../stores/ui";
import { ZodError } from "zod";
export function errorMessage(error: unknown) {
  if (error instanceof ZodError)
    return error.issues
      .map((i) => `${i.path.join(".") || "Input"}: ${i.message}`)
      .join("; ");
  if (error instanceof Error && /quota/i.test(error.name + error.message))
    return "Browser storage is full. Export a backup and remove unused images, then retry.";
  return error instanceof Error
    ? error.message
    : "Operation failed. Please try again.";
}
export async function perform(
  action: () => Promise<unknown>,
  success?: string,
) {
  try {
    await action();
    if (success && useUI.getState().notifications) toast.success(success);
    return true;
  } catch (error) {
    toast.error(errorMessage(error));
    return false;
  }
}
