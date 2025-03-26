export default function UserDetails() {
    // Placeholder for user details component
    // This component will display user details and handle loading state
    return (
        <div>
        <h1>User Details</h1>
        <p>Details about the user will be displayed here.</p>
        </div>
    );
}

// import React, { useEffect, useState } from 'react';
// import apiService from '../../../services/apiService';
// import { useAuth } from '../../../hooks/useAuth';

// export default function UserDetails() {
//   const [loading, setLoading] = useState(true);
//   const [user, setUser] = useState(null);
//   const [error, setError] = useState('');
//   const { redirectToSpotifyLogin, logout } = useAuth();

//   useEffect(() => {
//     const fetchUserData = async () => {
//       try {
//         if (!apiService.isAuthenticated()) {
//           redirectToSpotifyLogin('/account');
//           return;
//         }
        
//         const userData = await apiService.getCurrentUser();
//         setUser(userData);
//       } catch (err) {
//         console.error("Error loading user data:", err);
//         setError("Failed to load profile. Please try again.");
//       } finally {
//         setLoading(false);
//       }
//     };
    
//     fetchUserData();
//   }, [redirectToSpotifyLogin]);

//   // Get greeting based on time of day
//   const getGreeting = () => {
//     const hour = new Date().getHours();
//     if (hour >= 5 && hour < 12) return "Good Morning";
//     if (hour >= 12 && hour < 18) return "Good Afternoon";
//     return "Good Evening";
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="animate-pulse flex flex-col items-center">
//           <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
//           <p className="mt-4 text-accent">Loading profile...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div>
//       <h1>User Details</h1>
//       <p>Details about the user will be displayed here.</p>
//     </div>
//   );
// }