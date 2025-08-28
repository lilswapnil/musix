import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faArrowLeft, 
  faMusic,
  faHeadphones,
  faCompactDisc,
  faListUl
} from "@fortawesome/free-solid-svg-icons";
import LoadingSpinner from "../../../components/common/ui/LoadingSpinner";
import { spotifyService } from '../../../services/spotifyServices';
import { deezerService } from '../../../services/deezerServices';

export default function Genres() {
    const { genreName } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const genreState = location.state || {};
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
    
    // Album grid component for rendering albums
    const AlbumGrid = ({ albums, source }) => {
        if (!albums || albums.length === 0) {
            return (
                <div className="text-center py-4 text-muted">
                    No albums found from {source}
                </div>
            );
        }
        
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {albums.map((album) => {
                    // Handle different API structures
                    const albumId = album.id;
                    const albumName = source === 'Spotify' ? album.name : album.title;
                    const albumImage = source === 'Spotify' 
                        ? (album.images && album.images[0]?.url) 
                        : (album.cover_xl || album.cover_big || album.cover_medium);
                    const artistName = source === 'Spotify'
                        ? (album.artists && album.artists[0]?.name)
                        : (album.artist?.name);
                    
                    return (
                        <div 
                            key={`${source}-${albumId}`}
                            className="bg-primary-light/30 rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-105"
                            onClick={() => handleAlbumClick(album, source)}
                        >
                            <div className="aspect-square overflow-hidden">
                                <img 
                                    src={albumImage || defaultImage} 
                                    alt={albumName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "https://via.placeholder.com/300x300?text=Album";
                                    }}
                                />
                            </div>
                            <div className="p-3">
                                <h4 className="font-medium text-sm truncate">{albumName}</h4>
                                {artistName && <p className="text-xs text-muted truncate">{artistName}</p>}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };
    
    // Playlist grid component for rendering playlists
    const PlaylistGrid = ({ playlists, source }) => {
        if (!playlists || playlists.length === 0) {
            return (
                <div className="text-center py-4 text-muted">
                    No playlists found from {source}
                </div>
            );
        }
        
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {playlists.map((playlist) => {
                    // Handle different API structures
                    const playlistId = playlist.id;
                    const playlistName = source === 'Spotify' ? playlist.name : playlist.title;
                    const playlistImage = source === 'Spotify' 
                        ? (playlist.images && playlist.images[0]?.url) 
                        : (playlist.picture_xl || playlist.picture_big || playlist.picture_medium);
                    const ownerName = source === 'Spotify'
                        ? (playlist.owner?.display_name || 'Spotify')
                        : (playlist.user?.name || 'Deezer');
                    const trackCount = source === 'Spotify'
                        ? (playlist.tracks?.total || 0)
                        : (playlist.nb_tracks || 0);
                    
                    return (
                        <div 
                            key={`${source}-${playlistId}`}
                            className="bg-primary-light/30 rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-105"
                            onClick={() => handlePlaylistClick(playlist, source)}
                        >
                            <div className="aspect-square overflow-hidden">
                                <img 
                                    src={playlistImage || defaultImage} 
                                    alt={playlistName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "https://via.placeholder.com/300x300?text=Playlist";
                                    }}
                                />
                            </div>
                            <div className="p-3">
                                <h4 className="font-medium text-sm truncate">{playlistName}</h4>
                                <p className="text-xs text-muted truncate">By {ownerName}</p>
                                <p className="text-xs text-muted">{trackCount} tracks</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };
    
    return (
        <div className="my-6">
            {/* Back button */}
            <button 
                onClick={handleGoBack} 
                className="flex items-center text-muted hover:text-white mb-6 transition-colors"
            >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                Back
            </button>
            
            {/* Genre header with background and image - similar to album header */}
            <div className="flex flex-col md:flex-row mb-8 bg-primary-light/30 rounded-lg p-4 md:p-6 relative overflow-hidden">
                {/* Blurry background from genre image */}
                <div className="absolute inset-0 overflow-hidden">
                    <div 
                        className="absolute inset-0 bg-cover bg-center blur-md scale-110 opacity-60"
                        style={{ backgroundImage: `url(${genreImage})` }}
                    ></div>
                    <div className="absolute inset-0 bg-primary-dark/70"></div>
                </div>
                
                {/* Genre cover art */}
                <div className="w-full md:w-48 lg:w-64 xl:w-80 flex-shrink-0 mb-4 md:mb-0 md:mr-6 relative z-10">
                    <div className="aspect-square w-full rounded-lg overflow-hidden shadow-xl">
                        <img 
                            src={genreImage} 
                            alt={decodedGenreName} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = defaultImage;
                            }}
                        />
                    </div>
                </div>
                
                {/* Genre info */}
                <div className="flex flex-col justify-between relative z-10 text-start">
                    <div>
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">
                            {decodedGenreName}
                        </h1>
                        
                        {/* Genre metadata */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm m-2">
                            <div className="flex items-center text-muted">
                                <FontAwesomeIcon icon={faMusic} className="mr-2" />
                                Music Genre
                            </div>
                            
                            {genreObject?.popularity && (
                                <div className="flex items-center text-muted">
                                    <FontAwesomeIcon icon={faHeadphones} className="mr-2" />
                                    Popularity: {genreObject.popularity}
                                </div>
                            )}
                            
                            {genreObject?.yearRange && (
                                <div className="flex items-center text-muted">
                                    <FontAwesomeIcon icon={faCompactDisc} className="mr-2" />
                                    Popular: {genreObject.yearRange}
                                </div>
                            )}
                        </div>
                        
                        <p className="text-white/80 mt-4 max-w-2xl">
                            {genreObject?.description || `Explore ${decodedGenreName} music and discover new artists, songs, and albums in this genre.`}
                        </p>
                    </div>

                    {/* External links */}
                    <div className="mt-6 flex gap-3">
                        <a 
                            href={`https://www.deezer.com/search/${encodeURIComponent(decodedGenreName)}/genre`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-primary hover:bg-primary/80 border-2 border-muted hover:border-accent text-white px-4 py-3 rounded-md inline-block transition-colors"
                        >
                            Find on Deezer
                        </a>
                        <a 
                            href={`https://open.spotify.com/search/${encodeURIComponent(decodedGenreName)}/genres`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-spotify hover:bg-[#1DB954]/80 text-white px-4 py-3 rounded-md inline-block transition-colors"
                        >
                            Explore on Spotify
                        </a>
                    </div>
                </div>
            </div>
            
            {/* Playlists by Genre */}
            <div className="mb-8">
                <h3 className="text-3xl font-semibold mb-4 text-start flex items-center">
                    <FontAwesomeIcon icon={faListUl} className="mr-3" />
                    Playlists in {decodedGenreName}
                </h3>
                
                {playlistsLoading ? (
                    <div className="bg-primary-light/20 rounded-lg p-8 text-center">
                        <LoadingSpinner message={`Loading ${decodedGenreName} playlists...`} />
                    </div>
                ) : playlistsError ? (
                    <div className="bg-error/10 border border-error/20 rounded-lg p-4 text-center">
                        <p className="text-error">{playlistsError}</p>
                    </div>
                ) : (
                    <>
                        {/* Spotify Playlists */}
                        {spotifyPlaylists.length > 0 && (
                            <div className="mb-8">
                                <h4 className="text-xl font-semibold mb-4 text-start flex items-center">
                                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                                    </svg>
                                    Spotify Playlists
                                </h4>
                                <PlaylistGrid playlists={spotifyPlaylists} source="Spotify" />
                            </div>
                        )}
                        
                        {/* Deezer Playlists */}
                        {deezerPlaylists.length > 0 && (
                            <div className="mb-8">
                                <h4 className="text-xl font-semibold mb-4 text-start flex items-center">
                                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M18.81 4.16v3.03H24V4.16h-5.19zM6.27 8.38v3.027h5.189V8.38h-5.19zm12.54 0v3.027H24V8.38h-5.19zM6.27 12.594v3.027h5.189v-3.027h-5.19zm6.271 0v3.027h5.19v-3.027h-5.19zm6.27 0v3.027H24v-3.027h-5.19zM0 16.81v3.029h5.19V16.81H0zm6.27 0v3.029h5.189V16.81h-5.19zm6.271 0v3.029h5.19V16.81h-5.19zm6.27 0v3.029H24V16.81h-5.19z"/>
                                    </svg>
                                    Deezer Playlists
                                </h4>
                                <PlaylistGrid playlists={deezerPlaylists} source="Deezer" />
                            </div>
                        )}
                        
                        {spotifyPlaylists.length === 0 && deezerPlaylists.length === 0 && (
                            <div className="bg-primary-light/20 rounded-lg p-8 text-center">
                                <p className="text-muted mb-4">No playlists found for {decodedGenreName}</p>
                                <p className="text-sm text-muted">Try searching for a different genre</p>
                            </div>
                        )}
                    </>
                )}
            </div>
            
            {/* Albums by Genre */}
            <div className="mb-8">
                <h3 className="text-3xl font-semibold mb-4 text-start flex items-center">
                    <FontAwesomeIcon icon={faCompactDisc} className="mr-3" />
                    Top Albums in {decodedGenreName}
                </h3>
                
                {albumsLoading ? (
                    <div className="bg-primary-light/20 rounded-lg p-8 text-center">
                        <LoadingSpinner message={`Loading ${decodedGenreName} albums...`} />
                    </div>
                ) : albumsError ? (
                    <div className="bg-error/10 border border-error/20 rounded-lg p-4 text-center">
                        <p className="text-error">{albumsError}</p>
                    </div>
                ) : (
                    <>
                        {/* Spotify Albums */}
                        {spotifyAlbums.length > 0 && (
                            <div className="mb-8">
                                <h4 className="text-xl font-semibold mb-4 text-start flex items-center">
                                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                                    </svg>
                                    Spotify Albums
                                </h4>
                                <AlbumGrid albums={spotifyAlbums} source="Spotify" />
                            </div>
                        )}
                        
                        {/* Deezer Albums */}
                        {deezerAlbums.length > 0 && (
                            <div className="mb-8">
                                <h4 className="text-xl font-semibold mb-4 text-start flex items-center">
                                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M18.81 4.16v3.03H24V4.16h-5.19zM6.27 8.38v3.027h5.189V8.38h-5.19zm12.54 0v3.027H24V8.38h-5.19zM6.27 12.594v3.027h5.189v-3.027h-5.19zm6.271 0v3.027h5.19v-3.027h-5.19zm6.27 0v3.027H24v-3.027h-5.19zM0 16.81v3.029h5.19V16.81H0zm6.27 0v3.029h5.189V16.81h-5.19zm6.271 0v3.029h5.19V16.81h-5.19zm6.27 0v3.029H24V16.81h-5.19z"/>
                                    </svg>
                                    Deezer Albums
                                </h4>
                                <AlbumGrid albums={deezerAlbums} source="Deezer" />
                            </div>
                        )}
                        
                        {spotifyAlbums.length === 0 && deezerAlbums.length === 0 && (
                            <div className="bg-primary-light/20 rounded-lg p-8 text-center">
                                <p className="text-muted mb-4">No albums found for {decodedGenreName}</p>
                                <p className="text-sm text-muted">Try searching for a different genre</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}