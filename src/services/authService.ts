import { supabase } from "./supabase";
export async function register(
  email: string,
  password: string,
  displayName: string,
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function fetchUserProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateUsername(userId: string, username: string) {
  // 1. Ask Supabase for the verified session user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Authentication required");

  const { data, error } = await supabase
    .from("profiles")
    .update({ username })
    .eq("id", user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function sendPasswordResetOtp(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: undefined, // We are not using a redirect URL for native app flow
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function verifyResetOtp(email: string, token: string) {
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "recovery",
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function updateUserPassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    throw new Error(error.message);
  }
}
