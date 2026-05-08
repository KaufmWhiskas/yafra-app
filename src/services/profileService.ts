import { supabase } from "./supabase";

export interface UserProfile {
  email: string;
  reviewCount: number;
}

export const fetchUserProfile = async (): Promise<UserProfile> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) throw new Error("User not logged in");

  const { count } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  return { email: user.email, reviewCount: count || 0 };
};