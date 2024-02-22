'use strict';

import apiHandler from "./apiHandler.js";
import pagination from "./pagination.js";

let currentPage = 1;
const moviesPerPage = 4;
let shuffledMovies = [];
let foundMovies = [];

window.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded');

    try {
        const page = window.location.pathname.split('/').pop();
        if (page === 'favourites.html') {
            renderFavourites();
        } else {
            await fetchTrailer();
            await fetchTopMovies();
        }
        updateFavouritesIcons();
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

        const moviesContainer = document.querySelector('.content-wrapper__aside--right');
        moviesContainer.innerHTML = '';

        //should use OMDB api not teachers, maybe create new function
        renderMovies(currentMovies);

        document.getElementById('page-text').textContent = `Page ${currentPage} of ${Math.ceil(shuffledMovies.length / moviesPerPage)}`;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

function renderMovies(movies = [], shuffle = false) {
    const moviesContainer = document.querySelector('.content-wrapper__aside--right');
    const page = window.location.pathname.split('/').pop();

    const movieCardsContainer = document.createElement('div');
    movieCardsContainer.className = 'movie-cards-container';

    if (shuffle) {
        movies = shuffleArray(movies);
    }

    movies.forEach((movie) => {
        const movieCard = createMovieCard(movie);
        movieCardsContainer.appendChild(movieCard);
    });

    if (moviesContainer && page !== 'favourites.html') {
        moviesContainer.appendChild(movieCardsContainer);
    }

    renderPagination(movies);
}

function createMovieCard(movie) {
    const normalizedMovie = normalizeMovieData(movie);
    const movieCard = document.createElement('div');
    movieCard.className = 'movie-card';

    const movieData = `
        <div class="poster-wrapper">
        <img src="${normalizedMovie.poster === 'N/A' ? 'assets/dog.png' : normalizedMovie.poster}" alt="${normalizedMovie.title} movie poster" class="activity-results__item">            
        <img src="${getHeartIcon(normalizedMovie)}" alt="Add to favourites" class="favourite-icon">
        </div>
        <h2 class="activity-results__item-header">${normalizedMovie.title}</h2>
        `;

    movieCard.innerHTML = movieData;
    const favouriteIcon = movieCard.querySelector('.favourite-icon');
    favouriteIcon.addEventListener('click', (event) => handleFavouriteIconClick(normalizedMovie, favouriteIcon, event));

    movieCard.addEventListener('click', async () => {
        const imdbIdProperty = movie.hasOwnProperty('imdbID') ? 'imdbID' : 'imdbid';
        const movieDetails = await apiHandler.fetchData(`http://www.omdbapi.com/?apikey=cf9e4f0d&i=${movie[imdbIdProperty]}&plot=full`);
        populateModal(modal, movieDetails);
        modal.style.display = 'block';
    });

    return movieCard;
}

const modal = createModal();
const closeButton = modal.querySelector('.close-button');
closeButton.addEventListener('click', () => {
    modal.style.display = 'none';
});

function handleFavouriteIconClick(movie, favouriteIcon, event) {
    event.stopPropagation();
    let favourites = JSON.parse(localStorage.getItem('favourites')) || [];

    const index = favourites.findIndex(favourite => favourite.imdbid === movie.imdbid);

    if (index === -1) {
        favourites.push(movie);
    } else {
        favourites.splice(index, 1);
        const page = window.location.pathname.split('/').pop();
        if (page === 'favourites.html') {
            favouriteIcon.parentElement.parentElement.remove();
        }
    }

    localStorage.setItem('favourites', JSON.stringify(favourites));
    favouriteIcon.src = getHeartIcon(movie);
}

function renderPagination() {
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination-container';

    const prevArrow = createArrow('left', 'previous page arrow', 'assets/left arrow.png', false);
    const nextArrow = createArrow('right', 'next page arrow', 'assets/right arrow.png', false);
    const nextPageText = document.createElement('span');
    nextPageText.id = 'page-text';

    prevArrow.addEventListener('click', handlePrevArrowClick);
    nextArrow.addEventListener('click', handleNextArrowClick);

    nextPageText.textContent = `Page ${currentPage} of ${Math.ceil(shuffledMovies.length / moviesPerPage)}`;

    paginationContainer.appendChild(prevArrow);
    paginationContainer.appendChild(nextPageText);
    paginationContainer.appendChild(nextArrow);

    const resultsContainer = document.querySelector('#results-container');
    if (resultsContainer) {
        if (page !== 'favourites.html') {
            const movieCardsContainer = document.querySelector('.found-movie-cards-container');
            if (movieCardsContainer) {
                resultsContainer.appendChild(movieCardsContainer);
            }
        }
    } else {
        const moviesContainer = document.querySelector('.content-wrapper__aside--right');
        if (moviesContainer) {
            if (page !== 'favourites.html') {
                const movieCardsContainer = document.querySelector('.found-movie-cards-container');
                if (movieCardsContainer) {
                    moviesContainer.appendChild(movieCardsContainer);
                }
            }
            moviesContainer.appendChild(paginationContainer);
        } else {
            console.error('Movies container not found');
        }
    }
}

function handlePrevArrowClick() {
    if (currentPage > 1) {
        currentPage--;
        fetchTopMovies();
    }
}

function handleNextArrowClick() {
    if (currentPage < Math.ceil(shuffledMovies.length / moviesPerPage)) {
        currentPage++;
        fetchTopMovies();
    }
}

function getHeartIcon(movie) {
    let favourites = JSON.parse(localStorage.getItem('favourites')) || [];
    const isFavourited = favourites.some(favourite => favourite.imdbid === movie.imdbid);
    return isFavourited ? 'assets/heart red.png' : 'assets/heart.png';
}

let page = window.location.pathname.split('/').pop();

if (page === 'favourites.html') {
    renderFavourites();
}

async function renderFavourites() {
    try {
        const favourites = JSON.parse(localStorage.getItem('favourites')) || [];
        const favouritesContainer = document.querySelector('.favourites__content-wrapper');
        if (favouritesContainer) {
            favouritesContainer.innerHTML = '';

            favourites.forEach((movie) => {
                const movieCard = createMovieCard(movie);
                favouritesContainer.appendChild(movieCard);
            });
        } else {
            console.error('Favourites container not found');
        }
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

function updateFavouritesIcons() {
    const favouriteIcons = document.querySelectorAll('.favourite-icon');
    favouriteIcons.forEach(icon => {
        //dont know if its necessary yet
    });
}

function createModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'none';
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
        <img src="${movie.Poster === 'N/A' ? 'assets/dog.png' : movie.Poster}" alt="${movie.Title} movie poster">
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

document.querySelector('.navigation__search').addEventListener('submit', searchMovies);

async function searchMovies(event) {
    event.preventDefault();

    const query = document.querySelector('.navigation__search-input').value;
    console.log(`Searching for: ${query}`);

    const response = await apiHandler.fetchData(`http://www.omdbapi.com/?apikey=cf9e4f0d&s=${query}`);
    console.log("API Response:", response);

    const page = window.location.pathname.split('/').pop();

    const mainRef = document.querySelector('.content-wrapper');

    if (response.Response === "True") {
        if (page !== 'favourites.html') {
            const mainRef = document.querySelector('.content-wrapper');
            mainRef.innerHTML = '';

            const paginationContainer = document.querySelector('.pagination-container');
            if (paginationContainer) {
                paginationContainer.innerHTML = '';
            }

            displaySearchResults(response.Search);
            foundMovies = response.Search;
            renderMovies(foundMovies);
            currentPage = 1;
        } else {
            const favouritesContainer = document.querySelector('.favourites__content-wrapper');
            favouritesContainer.innerHTML = '';

            displaySearchResults(response.Search);
            foundMovies = response.Search;
            renderMovies(foundMovies);
            currentPage = 1;
        }
    } else {
        console.error(`Error from API: ${response.Error}`);

        // Create a new div element for the error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = `Error: ${response.Error}`;

        // Add the error message to the page
        const mainRef = document.querySelector('.content-wrapper');
        mainRef.innerHTML = '';
        mainRef.appendChild(errorMessage);
    }
}

function displaySearchResults(movies) {
    let resultsContainer = document.querySelector('#results-container');

    if (!resultsContainer) {
        resultsContainer = document.createElement('div');
        resultsContainer.id = 'results-container';
        document.getElementById('foundParentContainer').appendChild(resultsContainer);
    }

    resultsContainer.innerHTML = '';

    const movieCardsContainer = document.createElement('div');
    movieCardsContainer.className = 'found-movie-cards-container';

    movies.forEach((movie) => {
        const movieCard = createMovieCard(movie);
        movieCardsContainer.appendChild(movieCard);
    });

    resultsContainer.appendChild(movieCardsContainer);
}



// async function displayMovieDetails(id) {
//     const response = await apiHandler.fetchData(`http://www.omdbapi.com/?apikey=cf9e4f0d&i=${id}&plot=full`);
//     populateModal(modal, response);
//     modal.style.display = 'block';
// }



// function renderFoundMovies(movies) {
//     const moviesContainer = document.querySelector('#results-container');
//     moviesContainer.innerHTML = '';

//     const movieCardsContainer = document.createElement('div');
//     movieCardsContainer.className = 'found-movie-cards-container';

//     movies.forEach((movie) => {
//         const movieCard = createMovieCard(movie);
//         movieCardsContainer.appendChild(movieCard);
//     });

//     moviesContainer.appendChild(movieCardsContainer);

//     moviesContainer.addEventListener('click', (event) => {
//         const target = event.target;
//         if (target.classList.contains('found-favourite-icon')) {
//             // Clicked on a heart icon
//             const movieCard = target.closest('.movie-card');
//             const movie = movies.find((m) => m.imdbID === movieCard.dataset.imdbID);
//             handleFavouriteIconClick(movie, target, event);
//         }
//     });

//     const favouriteIcon = document.createElement('img');
//     favouriteIcon.src = getHeartIcon(movies);
//     favouriteIcon.alt = 'Add to favourites';
//     favouriteIcon.classList.add('found-favourite-icon');

//     favouriteIcon.addEventListener('click', async (event) => {
//         handleFavouriteIconClick(movies, favouriteIcon, event);
//         await renderFavourites();
//         createFoundMovieCard();
//     });

//     displayMovieDetails();
// }

// function createFoundMovieCard(movie) {
//     const normalizedMovie = normalizeMovieData(movie);

//     const movieCard = document.createElement('div');
//     movieCard.className = 'movie-card';
//     movieCard.dataset.imdbID = normalizedMovie.imdbid;

//     const movieData = `
//         <div class="poster-wrapper">
//             <img src="${normalizedMovie.poster}" alt="movie poster" class="activity-results__item">
//             <img src="${getHeartIcon(normalizedMovie)}" alt="Add to favourites" class="favourite-icon">
//         </div>
//         <h2 class="activity-results__item-header">${normalizedMovie.title}</h2>
//         `;

//     movieCard.innerHTML = movieData;
//     const favouriteIcon = movieCard.querySelector('.favourite-icon');
//     favouriteIcon.addEventListener('click', (event) => handleFavouriteIconClick(normalizedMovie, favouriteIcon, event));

//     movieCard.addEventListener('click', async () => {
//         const movieDetails = await apiHandler.fetchData(`http://www.omdbapi.com/?apikey=cf9e4f0d&i=${movie.imdbid}&plot=full`);
//         populateModal(modal, movieDetails);
//         modal.style.display = 'block';
//     });

//     return movieCard;
// }

function normalizeMovieData(movie) {
    const normalizedMovie = {};
    for (const key in movie) {
        if (Object.prototype.hasOwnProperty.call(movie, key)) {
            // Convert each key to lowercase
            normalizedMovie[key.toLowerCase()] = movie[key];
        }
    }
    return normalizedMovie;
}