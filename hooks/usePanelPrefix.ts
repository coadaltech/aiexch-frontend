import { useAuth } from "@/contexts/AuthContext";
import { roleToPrefix } from "@/lib/panel-utils";

/**
 * Returns the URL prefix for the current user's panel role.
 * e.g. "/admin", "/owner", "/super"
 */
export function usePanelPrefix(): string {
  const { user } = useAuth();
  return `/${roleToPrefix(user?.role)}`;
}
