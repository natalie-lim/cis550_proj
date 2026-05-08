"use client";

import { useAuth } from "@/components/AuthProvider";
import { recordZipView } from "@/lib/userHistory";
import { useEffect, useRef } from "react";

export function RecordZipView(props: {
  zipCode: string;
  city?: string | null;
  state?: string | null;
}): null {
  const { user, loading } = useAuth();
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    const key = `${user.uid}:${props.zipCode}`;
    if (lastKey.current === key) return;
    lastKey.current = key;

    void recordZipView({
      uid: user.uid,
      zipCode: props.zipCode,
      city: props.city ?? null,
      state: props.state ?? null,
    });
  }, [loading, user, props.zipCode, props.city, props.state]);

  return null;
}
