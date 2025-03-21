import { useState, useEffect } from "react"
import { deezerService } from "../../../services/deezerServices";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import ScrollableSection from "../../../components/common/ui/ScrollableSection";

export default function FeaturedPlaylists() {
    const [playlists, setFeaturedPlaylist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchFeaturedPlaylists = async () => {
            try {
                setLoading(true);
                const response = await deezerService.getFeaturedPlaylists(20); // Fetch 20 playlists
                
                if (response && response.data) {
                    const formattedPlaylists = response.data.map(playlist => ({
                        id: playlist.id,
                        title: playlist.title,
                        coverArt: playlist.picture_medium || playlist.picture_small || 'path/to/default/image.jpg',
                        link: playlist.link,
                        description: playlist.description,
                        tracksCount: playlist.nb_tracks || 0
                    }));
                    
                    setFeaturedPlaylist(formattedPlaylists);
                } else {
                    throw new Error('Invalid response format');
                }
            }
            catch (err) {
                console.error('Failed to load featured playlists:', err);
                setError(`Could not load featured playlists: ${err.message}`);
            }
                
            finally {
                setLoading(false);
            }
        };

        fetchFeaturedPlaylists();
       
    }, []);

    if (loading) {
        return(
            <div className="mb-10">
                <h2 className="text-3xl font-bold mb-4 text-start">Featured Playlists</h2>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-pulse flex flex-col items-center">
                        <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-accent">Loading featured playlists...</p>
                    </div>
                </div>
            </div>
        );
    }
            
    if (error || playlists.length === 0) {
        return (
            <div className="mb-10">
                <h2 className="text-3xl font-bold mb-4 text-start">Featured Playlists</h2>
                <div className="border-muted border rounded-lg p-6 text-center">
                    <p className="text-error mb-4">{error || 'No featured playlists available'}</p>
                </div>
            </div>
        ); 
    }
        
    return (
        <ScrollableSection title="Featured Playlists">
            <div className="flex space-x-2 pb-1">
                {playlists.map((playlist) => (
                    <div 
                        key={playlist.id} 
                        className="flex-shrink-0 w-32 sm:w-40 md:w-48 overflow-hidden hover:bg-opacity-80 transition-colors cursor-pointer group border-muted"
                        onClick={() => window.open(playlist.link, "_blank")}
                    >   
                        <div className="relative">
                            <img 
                                src={playlist.coverArt} 
                                alt={playlist.title} 
                                className="w-full h-32 sm:h-40 md:h-48 object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center">
                                    <FontAwesomeIcon 
                                        icon={faExternalLinkAlt} 
                                        className="text-white text-sm sm:text-base md:text-xl"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-2 sm:p-3 md:p-4">
                            <div className="text-center">
                                <h3 className="font-semibold text-white text-xs sm:text-sm truncate">{playlist.title}</h3>
                                {playlist.tracksCount > 0 && (
                                    <p className="text-[10px] sm:text-xs text-muted mt-0.5 sm:mt-1">
                                        {playlist.tracksCount} tracks
                                    </p>
                                )}
                                {playlist.description && (
                                    <p className="text-[10px] sm:text-xs text-muted mt-0.5 sm:mt-1 truncate">
                                        {playlist.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollableSection>
    )
}