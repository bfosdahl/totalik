import { supabase } from "@/integrations/supabase/client";
import { readEdgeFunctionError } from "@/utils/edgeFunctionError";

type SetAdminUserPasswordInput = {
  userId: string;
  newPassword: string;
  sendEmail: boolean;
};

type SetAdminUserPasswordResult = {
  success: boolean;
  message: string;
  passwordSet: boolean;
  emailSent: boolean;
};

/**
 * Uses the current access token instead of rotating the refresh token.
 * The edge function verifies this token cryptographically, so another browser
 * tab cannot break the request by rotating the shared refresh session.
 */
export async function setAdminUserPassword(
  input: SetAdminUserPasswordInput,
): Promise<SetAdminUserPasswordResult> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (sessionError || !accessToken) {
    throw new Error("Du er ikke innlogget. Logg inn på nytt og prøv igjen.");
  }

  const { data, error } = await supabase.functions.invoke("reset-user-password", {
    body: input,
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (error) {
    throw new Error(await readEdgeFunctionError(error, "Kunne ikke endre passord."));
  }
  if (data?.error) throw new Error(data.error);

  return data as SetAdminUserPasswordResult;
}