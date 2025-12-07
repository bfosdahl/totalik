import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export function usePushNotifications() {
  const { user, company } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
      checkExistingSubscription();
    } else {
      setIsLoading(false);
    }
  }, [user?.id]);

  const checkExistingSubscription = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        // Check if this subscription exists in database
        const { data } = await supabase
          .from("push_subscriptions")
          .select("id")
          .eq("user_id", user.id)
          .eq("endpoint", subscription.endpoint)
          .maybeSingle();
        
        setIsSubscribed(!!data);
      } else {
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) return false;
    
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === "granted";
  };

  const subscribe = useCallback(async () => {
    if (!isSupported || !user?.id || !company?.id) {
      toast.error("Push-varsler støttes ikke i denne nettleseren");
      return false;
    }

    setIsLoading(true);
    try {
      const permissionGranted = await requestPermission();
      if (!permissionGranted) {
        toast.error("Du må tillate varsler for å motta push-varsler");
        setIsLoading(false);
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Get VAPID public key from edge function
      const { data: vapidData, error: vapidError } = await supabase.functions.invoke("push-vapid-key");
      
      if (vapidError || !vapidData?.publicKey) {
        console.error("Failed to get VAPID key:", vapidError);
        toast.error("Kunne ikke aktivere push-varsler");
        setIsLoading(false);
        return false;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidData.publicKey,
      });

      const subscriptionJson = subscription.toJSON();
      const keys = subscriptionJson.keys as unknown as PushSubscriptionKeys;
      
      if (!keys?.p256dh || !keys?.auth) {
        console.error("Invalid subscription keys");
        toast.error("Kunne ikke aktivere push-varsler");
        setIsLoading(false);
        return false;
      }

      

      // Save subscription to database
      const { error: saveError } = await supabase
        .from("push_subscriptions")
        .upsert({
          user_id: user.id,
          company_id: company.id,
          endpoint: subscription.endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
        }, {
          onConflict: "user_id,endpoint",
        });

      if (saveError) {
        console.error("Failed to save subscription:", saveError);
        toast.error("Kunne ikke lagre push-abonnement");
        setIsLoading(false);
        return false;
      }

      setIsSubscribed(true);
      toast.success("Push-varsler aktivert!");
      return true;
    } catch (error) {
      console.error("Error subscribing to push:", error);
      toast.error("Kunne ikke aktivere push-varsler");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, user?.id, company?.id]);

  const unsubscribe = useCallback(async () => {
    if (!user?.id) return false;

    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove from database
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", user.id)
          .eq("endpoint", subscription.endpoint);
      }

      setIsSubscribed(false);
      toast.success("Push-varsler deaktivert");
      return true;
    } catch (error) {
      console.error("Error unsubscribing:", error);
      toast.error("Kunne ikke deaktivere push-varsler");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
  };
}
