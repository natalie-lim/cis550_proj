import { firestore } from "@/lib/firebaseClient";
import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";

export type ZipViewItem = {
  id: string;
  zipCode: string;
  city?: string | null;
  state?: string | null;
  createdAt: Timestamp | null;
};

export async function recordZipView(args: {
  uid: string;
  zipCode: string;
  city?: string | null;
  state?: string | null;
}): Promise<void> {
  const ref = collection(firestore, "users", args.uid, "zipViews");
  await addDoc(ref, {
    zipCode: args.zipCode,
    city: args.city ?? null,
    state: args.state ?? null,
    createdAt: serverTimestamp(),
  });
}

export function subscribeToZipViews(args: {
  uid: string;
  max: number;
  onData: (items: ZipViewItem[]) => void;
  onError?: (message: string) => void;
}): () => void {
  const ref = collection(firestore, "users", args.uid, "zipViews");
  const q = query(ref, orderBy("createdAt", "desc"), limit(args.max));

  return onSnapshot(
    q,
    (snap) => {
      const items: ZipViewItem[] = snap.docs.map((d) => {
        const data = d.data() as {
          zipCode?: string;
          city?: string | null;
          state?: string | null;
          createdAt?: Timestamp;
        };
        return {
          id: d.id,
          zipCode: data.zipCode ?? "—",
          city: data.city ?? null,
          state: data.state ?? null,
          createdAt: data.createdAt ?? null,
        };
      });
      args.onData(items);
    },
    (err) => {
      args.onError?.(err.message);
    },
  );
}
