import { useQuery } from "@tanstack/react-query";
import { useNavigate } from 'react-router-dom';
import { deezerService } from "../../../../services/deezerServices";
import { spotifyService } from "../../../../services/spotifyServices";
import FeaturedPlaylistsLoading from "./FeaturedPlaylistsLoading";
import FeaturedPlaylistsEmpty from "./FeaturedPlaylistsEmpty";
import FeaturedPlaylistsList from "./FeaturedPlaylistsList";

export default function FeaturedPlaylists({ useSpotify = false }) {
    const navigate = useNavigate();
    const fetchFeaturedPlaylists = async () => {
        if (useSpotify) {
            const response = await spotifyService.getFeaturedPlaylists(20);
            const items = response?.playlists?.items || [];
            if (items.length > 0) {
                return items.map((playlist) => ({
                    id: playlist.id,
                    title: playlist.name,
                    coverArt: playlist.images?.[0]?.url || "path/to/default/image.jpg",
                    link: playlist.external_urls?.spotify,
                    description: playlist.description,
                    tracksCount: playlist.tracks?.total || 0,
                    source: 'spotify'
                }));
            }
            throw new Error('No Spotify featured playlists available');
        }

        const response = await deezerService.getFeaturedPlaylists(20);
        if (response && response.data) {
            return response.data.map((playlist) => ({
                id: playlist.id,
                title: playlist.title,
                coverArt: playlist.picture_medium || playlist.picture_small || "path/to/default/image.jpg",
                link: playlist.link,
                description: playlist.description,
                tracksCount: playlist.nb_tracks || 0,
                source: 'deezer'
            }));
        }
        throw new Error("Invalid response format");
    };

    const {
        data: playlists = [],
        isLoading,
        error
    } = useQuery({
        queryKey: ['featured-playlists', useSpotify],
        queryFn: fetchFeaturedPlaylists
    });

    if (isLoading) {
        return <FeaturedPlaylistsLoading />;
    }

    if (error || playlists.length === 0) {
        return (
            <FeaturedPlaylistsEmpty
                message={error?.message || "No featured playlists available"}
            />
        );
    }

    const handlePlaylistClick = (playlist) => {
        if (playlist.source === 'spotify' && playlist.link) {
            window.open(playlist.link, '_blank', 'noopener,noreferrer');
        } else {
            navigate(`/search?query=${encodeURIComponent(playlist.title)}`);
        }
    };

    return (
        <FeaturedPlaylistsList playlists={playlists} onPlaylistClick={handlePlaylistClick} />
    );
}