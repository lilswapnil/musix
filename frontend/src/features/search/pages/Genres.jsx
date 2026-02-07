import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import LoadingSpinner from "../../../components/common/ui/LoadingSpinner";
import { spotifyService } from '../../../services/spotifyServices';
import { deezerService } from '../../../services/deezerServices';
import GenreHeader from "../components/genres/GenreHeader";
import GenrePlaylistsSection from "../components/genres/GenrePlaylistsSection";
import GenreAlbumsSection from "../components/genres/GenreAlbumsSection";

export default function Genres() {
    const { genreName } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const genreState = useMemo(() => location.state || {}, [location.state]);
    const [loading] = useState(false);
    const [spotifyAlbums, setSpotifyAlbums] = useState([]);
    const [deezerAlbums, setDeezerAlbums] = useState([]);
    const [spotifyPlaylists, setSpotifyPlaylists] = useState([]);
    const [deezerPlaylists, setDeezerPlaylists] = useState([]);
    const [albumsLoading, setAlbumsLoading] = useState(true);
    const [playlistsLoading, setPlaylistsLoading] = useState(true);
    const [albumsError, setAlbumsError] = useState(null);
    const [playlistsError, setPlaylistsError] = useState(null);
    
    // Use decoded URL parameter or state.genreName as fallback
    const decodedGenreName = genreName ? decodeURIComponent(genreName) : genreState.genreName || '';
    
    // Get the full genre object if available in state
    const genreObject = genreState.genre;
    
    useEffect(() => {
        // Scroll to top when component mounts
        window.scrollTo(0, 0);
        
        // Log what we received to help debug
        console.log('Genre route params:', { 
            urlParam: genreName,
            decodedName: decodedGenreName,
            stateData: genreState
        });

        // Fetch albums by genre from Spotify and Deezer
        const fetchAlbumsByGenre = async () => {
            if (!decodedGenreName) return;
            
            setAlbumsLoading(true);
            
            try {
                // Fetch Spotify albums
                const spotifyResponse = await spotifyService.search(`genre:${decodedGenreName}`, 'album', 10);
                if (spotifyResponse && spotifyResponse.albums && spotifyResponse.albums.items) {
                    setSpotifyAlbums(spotifyResponse.albums.items);
                }
                
                // Fetch Deezer albums
                const deezerResponse = await deezerService.search(decodedGenreName, 'album', 10);
                if (deezerResponse && deezerResponse.data) {
                    setDeezerAlbums(deezerResponse.data);
                }
                
                setAlbumsError(null);
            } catch (error) {
                console.error('Error fetching albums by genre:', error);
                setAlbumsError('Failed to load albums for this genre');
            } finally {
                setAlbumsLoading(false);
            }
        };
        
        // Fetch playlists related to the genre
        const fetchPlaylistsByGenre = async () => {
            if (!decodedGenreName) return;
            
            setPlaylistsLoading(true);
            
            try {
                // Fetch Spotify playlists using the browse API with category 
                // that best matches our genre name
                const spotifyResponse = await spotifyService.apiRequest('/browse/categories', {
                    params: { limit: 50 }
                });
                
                // Find a category that matches or is similar to our genre
                let matchedCategory = null;
                if (spotifyResponse && spotifyResponse.categories && spotifyResponse.categories.items) {
                    matchedCategory = spotifyResponse.categories.items.find(category => 
                        category.name.toLowerCase().includes(decodedGenreName.toLowerCase()) ||
                        decodedGenreName.toLowerCase().includes(category.name.toLowerCase())
                    );
                }
                
                if (matchedCategory) {
                    // If we found a matching category, get its playlists
                    const categoryPlaylists = await spotifyService.apiRequest(
                        `/browse/categories/${matchedCategory.id}/playlists`,
                        { params: { limit: 10 } }
                    );
                    
                    if (categoryPlaylists && categoryPlaylists.playlists && categoryPlaylists.playlists.items) {
                        setSpotifyPlaylists(categoryPlaylists.playlists.items);
                    }
                } else {
                    // If no matching category, use search API with playlist type
                    const spotifySearchResponse = await spotifyService.search(decodedGenreName, 'playlist', 10);
                    if (spotifySearchResponse && spotifySearchResponse.playlists && spotifySearchResponse.playlists.items) {
                        setSpotifyPlaylists(spotifySearchResponse.playlists.items);
                    }
                }
                
                // Fetch Deezer playlists
                const deezerResponse = await deezerService.search(decodedGenreName, 'playlist', 10);
                if (deezerResponse && deezerResponse.data) {
                    setDeezerPlaylists(deezerResponse.data);
                }
                
                setPlaylistsError(null);
            } catch (error) {
                console.error('Error fetching playlists by genre:', error);
                setPlaylistsError('Failed to load playlists for this genre');
            } finally {
                setPlaylistsLoading(false);
            }
        };
        
        fetchAlbumsByGenre();
        fetchPlaylistsByGenre();
    }, [genreName, decodedGenreName, genreState]);
    
    // Go back to previous page
    const handleGoBack = () => {
        navigate(-1);
    };
    
    // Handle album click
    const handleAlbumClick = (album, source) => {
        if (source === 'Spotify' && album.id) {
            navigate(`/album/${album.id}`);
        } else if (source === 'Deezer' && album.id) {
            window.open(`https://www.deezer.com/album/${album.id}`, '_blank');
        }
    };
    
    // Handle playlist click
    const handlePlaylistClick = (playlist, source) => {
        if (source === 'Spotify' && playlist.id) {
            window.open(playlist.external_urls?.spotify || `https://open.spotify.com/playlist/${playlist.id}`, '_blank');
        } else if (source === 'Deezer' && playlist.id) {
            window.open(`https://www.deezer.com/playlist/${playlist.id}`, '_blank');
        }
    };
    
    // Default image if none is provided
    const defaultImage = "https://via.placeholder.com/500x500?text=Genre";
    const genreImage = genreObject?.imageUrl || defaultImage;
    
    // If still loading, show spinner
    if (loading) {
        return <LoadingSpinner message="Loading genre..." />;
    }
    
    return (
        <div className="my-6">
            <GenreHeader
                decodedGenreName={decodedGenreName}
                genreImage={genreImage}
                genreObject={genreObject}
                defaultImage={defaultImage}
                onGoBack={handleGoBack}
            />
            
            <GenrePlaylistsSection
                decodedGenreName={decodedGenreName}
                playlistsLoading={playlistsLoading}
                playlistsError={playlistsError}
                spotifyPlaylists={spotifyPlaylists}
                deezerPlaylists={deezerPlaylists}
                defaultImage={defaultImage}
                onPlaylistClick={handlePlaylistClick}
            />
            
            <GenreAlbumsSection
                decodedGenreName={decodedGenreName}
                albumsLoading={albumsLoading}
                albumsError={albumsError}
                spotifyAlbums={spotifyAlbums}
                deezerAlbums={deezerAlbums}
                defaultImage={defaultImage}
                onAlbumClick={handleAlbumClick}
            />
        </div>
    );
}