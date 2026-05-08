import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getServiceAccountJson(): string | null {
  const raw: string | undefined = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  return raw ? raw.trim() : null;
}

export function getAdminApp(): App | null {
  const existing = getApps();
  if (existing.length > 0) return existing[0]!;

  const serviceAccountJson = getServiceAccountJson();
  if (!serviceAccountJson) return null;

  const parsed = JSON.parse(serviceAccountJson) as {
    project_id: string;
    client_email: string;
    private_key: string;
  };

  return initializeApp({
    credential: cert({
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key
    })
  });
}

export async function verifyFirebaseIdToken(
  token: string
): Promise<{ uid: string; email?: string | undefined } | null> {
  const app = getAdminApp();
  if (!app) return null;
  try {
    const decoded = await getAuth(app).verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email };
  } catch {
    return null;
  }
}

