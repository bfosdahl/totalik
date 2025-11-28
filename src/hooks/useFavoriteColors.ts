import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface FavoriteColor {
  id: string;
  color: string;
  name: string | null;
  created_at: string;
}

export function useFavoriteColors() {
  const { company } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteColor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    if (!company?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("company_favorite_colors")
        .select("*")
        .eq("company_id", company.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error("Error fetching favorite colors:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [company?.id]);

  const addFavorite = async (color: string, name?: string) => {
    if (!company?.id) return false;

    // Validate color format
    const isHex = /^#[0-9A-Fa-f]{6}$/.test(color);
    const isPreset = !color.startsWith("#");
    
    if (!isHex && !isPreset) {
      toast.error("Ugyldig fargeformat");
      return false;
    }

    // Validate name length
    const trimmedName = name?.trim().slice(0, 50) || null;

    try {
      const { data, error } = await supabase
        .from("company_favorite_colors")
        .insert({
          company_id: company.id,
          color: color,
          name: trimmedName,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          toast.error("Denne fargen er allerede lagret som favoritt");
          return false;
        }
        throw error;
      }

      setFavorites((prev) => [data, ...prev]);
      toast.success("Farge lagret som favoritt!");
      return true;
    } catch (error: any) {
      console.error("Error adding favorite color:", error);
      toast.error(error.message || "Kunne ikke lagre favorittfarge");
      return false;
    }
  };

  const removeFavorite = async (id: string) => {
    try {
      const { error } = await supabase
        .from("company_favorite_colors")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setFavorites((prev) => prev.filter((f) => f.id !== id));
      toast.success("Favorittfarge fjernet");
      return true;
    } catch (error: any) {
      console.error("Error removing favorite color:", error);
      toast.error(error.message || "Kunne ikke fjerne favorittfarge");
      return false;
    }
  };

  return {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    refetch: fetchFavorites,
  };
}
