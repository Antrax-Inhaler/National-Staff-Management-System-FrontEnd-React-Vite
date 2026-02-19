// src/components/MetadataDebug.tsx
import { useAuth } from '../contexts/AuthContext';

export default function MetadataDebug() {
  const { session, user } = useAuth();

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
      <h3 className="font-bold">Metadata Debug</h3>
      <pre className="text-xs">
        User: {JSON.stringify(user, null, 2)}
      </pre>
      <pre className="text-xs">
        Session User: {JSON.stringify(session?.user, null, 2)}
      </pre>
      <pre className="text-xs">
        User Metadata: {JSON.stringify(session?.user?.user_metadata, null, 2)}
      </pre>
    </div>
  );
}