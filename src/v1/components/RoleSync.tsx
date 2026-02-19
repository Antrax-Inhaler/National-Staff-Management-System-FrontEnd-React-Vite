// // src/components/RoleSync.tsx
// import { useEffect, useState } from "react";
// import { supabase } from "../lib/supabase";
// import { request } from "../lib/apiRequest";
// import { useAuth } from "../contexts/AuthContext";


// export default function RoleSync() {
//   const { user, hasRoles } = useAuth();
//   const [isSyncing, setIsSyncing] = useState(false);

//   useEffect(() => {
//     const syncRoles = async () => {
//       if (!user || hasRoles || isSyncing) return;

//       setIsSyncing(true);
//       console.log("Syncing roles for user:", user.email);

//       try {
//         const path = `api/user/roles?email=${encodeURIComponent(user.email!)}`;
//         const response = await request(path);
        
//         if (response.ok) {
//           const data = await response.json();
//           console.log("Fetched roles from API:", data);

//           // Update Supabase user metadata with roles
//           const { error } = await supabase.auth.updateUser({
//             data: {
//               roles: data.roles || [],
//               affiliate_id: data.affiliate_id || null,
//             },
//           });

//           if (error) {
//             console.error("Error updating user metadata:", error);
//           } else {
//             console.log("User roles synced successfully, reloading...");
//             // Instead of reloading, let's update the state more gracefully
//             window.location.reload();
//           }
//         } else {
//           console.error("API response not OK:", response.status);
//         }
//       } catch (error) {
//         console.error("Error syncing roles:", error);
//       } finally {
//         setIsSyncing(false);
//       }
//     };

//     // Add a delay to ensure Supabase session is fully loaded
//     const timer = setTimeout(() => {
//       syncRoles();
//     }, 1000);

//     return () => clearTimeout(timer);
//   }, [user, hasRoles, isSyncing]);

//   if (isSyncing) {
//     return (
//       <div className="fixed p-2 text-sm text-white bg-blue-500 rounded top-4 right-4">
//         Syncing roles...
//       </div>
//     );
//   }

//   return null;
// }
