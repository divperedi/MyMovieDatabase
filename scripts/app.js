'use strict';

import apiHandler from "./apiHandler.js";
import pagination from "./pagination.js";

let currentPage = 1;
const moviesPerPage = 4;
let shuffledMovies = [];

window.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded');

    try {
        const page = window.location.pathname.split('/').pop();
        if (page === 'favourites.html') {
            // We're on the favourites page
            renderFavorites();
        } else {
            await fetchTrailer();
            await fetchTopMovies();
        }
        updateFavoritesIcons();
    } catch (error) {
        console.error(error);
    }
});

async function fetchTrailer() {
    try {
        const data = await apiHandler.fetchData('https://santosnr6.github.io/Data/movies.json');
        const selectedTrailers = getUniqueRandomItems(data, 5);
        renderCarousel(selectedTrailers);
    } catch (error) {
        console.error(error);
        throw error;
    }
}

function getUniqueRandomItems(array, count) {
    const shuffledArray = shuffleArray(array);
    return shuffledArray.slice(0, count);
}

function renderCarousel(trailers) {
     const carousel = document.createElement('div');
    carousel.className = 'carousel';

    trailers.forEach((trailer, index) => {
        const trailerElement = createTrailerElement(trailer, index === 0);
        carousel.appendChild(trailerElement);
    });

    const carouselContainer = document.createElement('div');
    carouselContainer.className = 'carousel-container';

    carouselContainer.appendChild(carousel);

    const trailerContainer = document.querySelector('.content-wrapper__aside.content-wrapper__aside--left');
    trailerContainer.appendChild(carouselContainer);

    appendArrowsToCarousel(carouselContainer, carousel, trailers);

    carouselContainer.appendChild(carousel);
}

function createTrailerElement(trailer, isVisible) {
    const trailerElement = document.createElement('iframe');
    trailerElement.src = trailer.trailer_link;
    trailerElement.className = 'carousel__trailer';
    trailerElement.style.display = isVisible ? 'block' : 'none';
    trailerElement.width = "560";
    trailerElement.height = "315";
    trailerElement.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    trailerElement.allowFullscreen = true;
    return trailerElement;
}

function appendArrowsToCarousel(carouselContainer, carousel, trailers) {
    const leftArrow = createArrow('left', 'Left Arrow', 'assets/left arrow.png', true);
    const rightArrow = createArrow('right', 'Right Arrow', 'assets/right arrow.png', true);

    leftArrow.addEventListener('mousedown', handleArrowMouseDown);
    leftArrow.addEventListener('mouseup', handleArrowMouseUp);
    rightArrow.addEventListener('mousedown', handleArrowMouseDown);
    rightArrow.addEventListener('mouseup', handleArrowMouseUp);

    carouselContainer.appendChild(leftArrow);
    carouselContainer.appendChild(rightArrow);

    let currentTrailer = 0;
    leftArrow.addEventListener('click', () => {
        toggleCarouselDisplay(currentTrailer, carousel);
        currentTrailer = (currentTrailer - 1 + trailers.length) % trailers.length;
        toggleCarouselDisplay(currentTrailer, carousel);
    });
    rightArrow.addEventListener('click', () => {
        toggleCarouselDisplay(currentTrailer, carousel);
        currentTrailer = (currentTrailer + 1) % trailers.length;
        toggleCarouselDisplay(currentTrailer, carousel);
    });
}

function createArrow(className, altText, src, isCarouselArrow) {
    const arrow = document.createElement('img');
    arrow.className = isCarouselArrow ? `carousel__arrow carousel__arrow--${className}` : 'pagination-arrow';
    arrow.src = src;
    arrow.alt = altText;
    return arrow;
}

function handleArrowMouseDown() {
    this.src = `assets/${this.alt.toLowerCase()} active.png`;
}

function handleArrowMouseUp() {
    this.src = `assets/${this.alt.toLowerCase()}.png`;
}

function toggleCarouselDisplay(currentTrailer, carousel) {
    if (carousel !== null) {
        for (let i = 0; i < carousel.children.length; i++) {
            carousel.children[i].style.display = 'none';
        }
        carousel.children[currentTrailer].style.display = 'block';
    } else {
        console.error('Carousel is null');
    }
}

async function fetchTopMovies() {
    try {
        if (!shuffledMovies.length) {
            let movies = await apiHandler.fetchData('https://santosnr6.github.io/Data/movies.json');
            console.log('Original movies array:', movies);

            shuffledMovies = shuffleArray(movies);
            console.log('Shuffled movies array:', shuffledMovies);
        }

        console.log('Current Page:', currentPage);

        const currentMovies = pagination.paginate(shuffledMovies, currentPage, moviesPerPage);
        console.log('Current movies array:', currentMovies);

        renderMovies(currentMovies);
    } catch (error) {
        console.error(error);
        throw error;
    }
}

function renderMovies(movies) {
    const moviesContainer = document.querySelector('.content-wrapper__aside--right');
    moviesContainer.innerHTML = '';

    const movieCardsContainer = document.createElement('div');
    movieCardsContainer.className = 'movie-cards-container';

    movies.forEach((movie) => {
        const movieCard = createMovieCard(movie);
        movieCardsContainer.appendChild(movieCard);
    });

    moviesContainer.appendChild(movieCardsContainer);
    renderPagination(shuffledMovies);
}

function createMovieCard(movie) {
    const movieCard = document.createElement('div');
    movieCard.className = 'movie-card';

    const movieData = `
        <div class="poster-wrapper">
            <img src="${movie.poster}" alt="movie poster" class="activity-results__item">
            <img src="${getHeartIcon(movie)}" alt="Add to favorites" class="favorite-icon">
        </div>
        <h2 class="activity-results__item-header">${movie.title}</h2>
    `;

    movieCard.innerHTML = movieData;
    const favoriteIcon = movieCard.querySelector('.favorite-icon');
    favoriteIcon.addEventListener('click', (event) => handleFavoriteIconClick(movie, favoriteIcon, event));

    movieCard.addEventListener('click', async () => {
        const movieDetails = await apiHandler.fetchData(`http://www.omdbapi.com/?apikey=cf9e4f0d&i=${movie.imdbid}&plot=full`);
        populateModal(modal, movieDetails);
        modal.style.display = 'block'; 
    });

    return movieCard;
}

const modal = createModal();
const closeButton = modal.querySelector('.close-button');
closeButton.addEventListener('click', () => {
    modal.style.display = 'none'; // hide the modal
});

function handleFavoriteIconClick(movie, favoriteIcon, event) {
    event.stopPropagation();
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

    const index = favorites.findIndex(favorite => favorite.imdbid === movie.imdbid);

    if (index === -1) {
        favorites.push(movie);
    } else {
        favorites.splice(index, 1);
        const page = window.location.pathname.split('/').pop();
        if (page === 'favourites.html') {
            favoriteIcon.parentElement.parentElement.remove();
        }
    }

    localStorage.setItem('favorites', JSON.stringify(favorites));
    favoriteIcon.src = getHeartIcon(movie);
}

function renderPagination(movies) {
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination-container';

    const prevArrow = createArrow('left', '<', 'assets/left arrow.png', false);
    const nextArrow = createArrow('right', '>', 'assets/right arrow.png', false);
    const nextPageText = document.createElement('span');
    nextPageText.id = 'page-text';

    prevArrow.addEventListener('click', handlePrevArrowClick);
    nextArrow.addEventListener('click', handleNextArrowClick);

    nextPageText.textContent = `Page ${currentPage} of ${Math.ceil(movies.length / moviesPerPage)}`;

    paginationContainer.appendChild(prevArrow);
    paginationContainer.appendChild(nextPageText); // Update the text content here
    paginationContainer.appendChild(nextArrow);

    const moviesContainer = document.querySelector('.content-wrapper__aside--right');
    moviesContainer.appendChild(paginationContainer);
}

function handlePrevArrowClick() {
    if (currentPage > 1) {
        currentPage--;
        fetchTopMovies();
        document.getElementById('page-text').textContent = `Page ${currentPage} of ${Math.ceil(shuffledMovies.length / moviesPerPage)}`;
    }
}

function handleNextArrowClick() {
    if (currentPage < Math.ceil(shuffledMovies.length / moviesPerPage)) {
        currentPage++;
        fetchTopMovies();
        document.getElementById('page-text').textContent = `Page ${currentPage} of ${Math.ceil(shuffledMovies.length / moviesPerPage)}`;
    }
}

function getHeartIcon(movie) {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const isFavorited = favorites.some(favorite => favorite.imdbid === movie.imdbid);
    return isFavorited ? 'assets/heart red.png' : 'assets/heart.png';
}

const page = window.location.pathname.split('/').pop();

if (page === 'favourites.html') {
    renderFavorites();
}

async function renderFavorites() {
    try {
        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        const favoritesContainer = document.querySelector('.favourites__content-wrapper');
        favoritesContainer.innerHTML = '';

        favorites.forEach((movie) => {
            const movieCard = createMovieCard(movie);
            favoritesContainer.appendChild(movieCard);
        });
    } catch (error) {
        console.error(error);
    }
}

function shuffleArray(array) {
    const indices = Array.from({ length: array.length }, (_, index) => index);
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices.map(index => array[index]);
}

function updateFavoritesIcons() {
    const favoriteIcons = document.querySelectorAll('.favorite-icon');
    favoriteIcons.forEach(icon => {
        // update icon based on whether the associated movie is a favorite
    });
}

function createModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'none'; // initially hidden
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-button">&times;</span>
            <div class="movie-details"></div>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

function populateModal(modal, movie) {
    const movieDetails = modal.querySelector('.movie-details');
    const modalContent = modal.querySelector('.modal-content');

    movieDetails.style.display = 'flex';
    movieDetails.style.flexDirection = 'row';
    movieDetails.style.justifyContent = 'space-between';
    movieDetails.style.alignItems = 'center';

    movieDetails.innerHTML = `
        <div class="movie-poster" style="flex: 1;">
            <img src="${movie.Poster}" alt="${movie.Title}">
        </div>
        <div class="movie-info" style="flex: 1;">
            <h2>${movie.Title}</h2>
            <br>
            <p>${movie.Year}</p>
            <p>${movie.Runtime}</p>
            <p>${movie.Genre}</p>
            <br>
            <p>Director: ${movie.Director}</p>
            <p>Actors: ${movie.Actors}</p>
            <p>Country: ${movie.Country}</p>
            <p>Awards: ${movie.Awards}</p>
            <p>IMDB Rating: ${movie.imdbRating}</p>
            <p>Box Office: ${movie.BoxOffice}</p>
            <br>
            <p>${movie.Plot}</p>
        </div>
    `;
    modalContent.style.background = '#FFA672';
}

/* <img src="${movie.Poster}" alt="Movie Poster"></img> */
/* <p>Released: ${movie.Released}</p> 
<p>DVD: ${movie.DVD}</p> 
<p>Writer: ${movie.Writer}</p>
<p>Language: ${movie.Language}</p> */
{/* <p>Ratings: ${movie.Ratings.map(rating => `${rating.Source}: ${rating.Value}`).join(', ')}</p> */}