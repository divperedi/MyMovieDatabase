'use strict';

import apiHandler from "./apiHandler.js";
import pagination from "./pagination.js";

let currentPage = 1;
const moviesPerPage = 4;
let shuffledMovies = [];
let foundMovies = [];


// Defines what happens when the DOM is fully loaded,
// when the DOM is loaded, checks if the current page is 'favourites.html',
// if it is, renders favourites,
// if not, fetches trailer and top movies,
// then updates favourites icons and adds event listener to search form 
// that calls the searchMovies function when the form is submitted
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

    document.querySelector('.navigation__search').addEventListener('submit', searchMovies);
});

// Fetches data from provided url, 
// selects 5 random items using func getUniqueRandomItems(array, count), 
// then passes them further to func renderCarousel, 
// in case of errors catches them and logs to console
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

// Takes 2 params, shuffles array, 
// returns 5 random shuffled items
function getUniqueRandomItems(array, count) {
    const shuffledArray = shuffleArray(array);
    return shuffledArray.slice(0, count);
}

// Creates a carousel of trailers,
// generates a carousel section, 
// populates it with trailer elements, 
// appends it to a specific container,
// adds navigation arrows to the carousel
function renderCarousel(trailers) {
    const carousel = document.createElement('section');
    carousel.className = 'carousel';

    trailers.forEach((trailer, index) => {
        const trailerElement = createTrailerElement(trailer, index === 0);
        carousel.appendChild(trailerElement);
    });

    const carouselContainer = document.createElement('section');
    carouselContainer.className = 'carousel-container';

    carouselContainer.appendChild(carousel);

    const trailerContainer = document.querySelector('.content-wrapper__aside.content-wrapper__aside--left');
    trailerContainer.appendChild(carouselContainer);

    appendArrowsToCarousel(carouselContainer, carousel, trailers);

    carouselContainer.appendChild(carousel);
}

// Creates an iframe element for a trailer,
// sets the source, style, dimensions, 
// permissions based on the input parameters,
// iframe is visible if 'isVisible' is true, otherwise hidden
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

// Adds navigation arrows to the carousel,
// creates left and right arrow elements, 
// attaches event listeners for mouse actions and click events, 
// appends them to the carousel container,
// click events on arrows cycle through the trailers
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

// Creates an image element for an arrow, 
// sets its class based on whether it's a carousel arrow or not, 
// assigns the source and alt text, 
// returns the created arrow
function createArrow(className, altText, src, isCarouselArrow) {
    const arrow = document.createElement('img');
    arrow.className = isCarouselArrow ? `carousel__arrow carousel__arrow--${className}` : 'pagination-arrow';
    arrow.src = src;
    arrow.alt = altText;
    return arrow;
}

// Changes source of the arrow image to 
// an active state when the mouse button is pressed
function handleArrowMouseDown() {
    this.src = `assets/${this.alt.toLowerCase()} active.png`;
}

// Reverts source of the arrow image back to its 
// original state when the mouse button is released
function handleArrowMouseUp() {
    this.src = `assets/${this.alt.toLowerCase()}.png`;
}

// Hides all children of the carousel,
// then displays the child at the 'currentTrailer' index,
// if the carousel is null, logs an error message
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

// Fetches a list of movies, shuffles them, displays pagination,
// if the movies weren't fetched and shuffled before does so,
// then gets the movies for the current page, 
// clears the movies container,
// renders the current movies, updates the page text
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

        renderMovies(currentMovies);

        document.getElementById('page-text').textContent = `Page ${currentPage} of ${Math.ceil(shuffledMovies.length / moviesPerPage)}`;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

// Creates and displays movie cards for a given list of movies,
// if shuffle is true, shuffles the movies,
// creates a movie card for each movie and appends it to a container,
// if the current page is not 'favourites.html', 
// appends the container to the movies container,
// renders pagination for the movies
function renderMovies(movies = [], shuffle = false) {
    const moviesContainer = document.querySelector('.content-wrapper__aside--right');
    const page = window.location.pathname.split('/').pop();

    const movieCardsContainer = document.createElement('section');
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

// Creates a movie card section for a movie,
// normalizes the movie data, creates html for the movie card, 
// adds event listeners for clicking on the favourite icon and the movie card,
// clicking on the movie card fetches detailed movie data and creates a modal with it
function createMovieCard(movie) {
    const normalizedMovie = normalizeMovieData(movie);
    const movieCard = document.createElement('section');
    movieCard.className = 'movie-card';

    const movieData = `
        <article class="poster-wrapper">
            <img src="${normalizedMovie.poster === 'N/A' ? 'assets/dog.png' : normalizedMovie.poster}" alt="${normalizedMovie.title} movie poster" class="activity-results__item">            
            <img src="${getHeartIcon(normalizedMovie)}" alt="Add to favourites" class="favourite-icon">
        </article>
        <h2 class="activity-results__item-header">${normalizedMovie.title}</h2>
        `;

    movieCard.innerHTML = movieData;
    const favouriteIcon = movieCard.querySelector('.favourite-icon');
    favouriteIcon.addEventListener('click', (event) => handleFavouriteIconClick(normalizedMovie, favouriteIcon, event));

    movieCard.addEventListener('click', async () => {
        try {
            const imdbIdProperty = movie.hasOwnProperty('imdbID') ? 'imdbID' : 'imdbid';
            const movieDetails = await apiHandler.fetchData(`http://www.omdbapi.com/?apikey=cf9e4f0d&i=${movie[imdbIdProperty]}&plot=full`);
            populateModal(modal, movieDetails);
            modal.style.display = 'block';
        } catch (error) {
            console.error('Oops,', error);
        }
    });

    return movieCard;
}

// Creates new object with same properties as original movie object, 
// but with all property names converted to lowercase,
// going through each property in the movie object and 
// adding it to new object with a lowercase name

// Needed because one api uses smal letters for data properties, 
// when second one starts properties with big letter
function normalizeMovieData(movie) {
    const normalizedMovie = {};
    for (const key in movie) {
        if (Object.prototype.hasOwnProperty.call(movie, key)) {
            normalizedMovie[key.toLowerCase()] = movie[key];
        }
    }
    return normalizedMovie;
}

// Creates a modal and adds click event listener to its close button to hide the modal
const modal = createModal();
const closeButton = modal.querySelector('.close-button');
closeButton.addEventListener('click', () => {
    modal.style.display = 'none';
});


// Manages the favourites list in local storage,
// adds the clicked movie to the favourites if it's not already there,
// removes it if it is, if the current page is 'favourites.html',
// removes the movie card, then updates the favourite icon's source
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

// Creates a pagination section with previous,next arrows and a page text,
// adds click event listeners to the arrows,
// appends the pagination section to the results container
// if it exists and the current page is not 'favourites.html',
// if the results container doesn't exist, it appends the pagination section to the movies container 
// if it exists and the current page is not 'favourites.html'
function renderPagination() {
    const paginationContainer = document.createElement('section');
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

// Decreases the current page number and fetches the movies 
// for the new page when the previous arrow is clicked, 
// as long as the current page is not the first one
function handlePrevArrowClick() {
    if (currentPage > 1) {
        currentPage--;
        fetchTopMovies();
    }
}

// Increases the current page number and fetches the movies 
// for the new page when the next arrow is clicked, 
// as long as the current page is not the last one
function handleNextArrowClick() {
    if (currentPage < Math.ceil(shuffledMovies.length / moviesPerPage)) {
        currentPage++;
        fetchTopMovies();
    }
}

// Checks if a movie is in the favourites list in local storage,
// returns the path to a red heart icon if it is, or an empty heart icon if it isn't,
// gets the last part of the current URL path and checks if it's 'favourites.html',
// if it is, it calls the 'renderFavourites' function
function getHeartIcon(movie) {
    let favourites = JSON.parse(localStorage.getItem('favourites')) || [];
    const isFavourited = favourites.some(favourite => favourite.imdbid === movie.imdbid);
    return isFavourited ? 'assets/heart red.png' : 'assets/heart.png';
}

let page = window.location.pathname.split('/').pop();

if (page === 'favourites.html') {
    renderFavourites();
}

// Fetches the list of favourite movies from local storage, 
// clears the favourites container, creates and appends movie card for each favourite movie,
// if the favourites container doesn't exist logs an error message
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

// Shuffles elements in an array,
// first creating a list of the array's element positions, 
// then randomly swapping these positions, 
// and using shuffled positions to create new array with elements in their new positions
function shuffleArray(array) {
    const indices = Array.from({ length: array.length }, (_, index) => index);
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices.map(index => array[index]);
}

// Creates modal section, 
// sets its class name and initial display style,
// fills it with html for the modal content,
// appends the modal to the body of the document and returns it
function createModal() {
    const modal = document.createElement('section');
    modal.className = 'modal';
    modal.style.display = 'none';
    modal.innerHTML = `
        <section class="modal-content">
            <span class="close-button">&times;</span>
            <div class="movie-details"></div>
        </section>
    `;
    document.body.appendChild(modal);
    return modal;
}

// Fills modal with details about a movie,
// finds the movie details and modal content sections in the modal, 
// sets the html of the movie details section 
// to include the movie's poster and details,
// changes the background color of the modal content section
function populateModal(modal, movie) {
    const movieDetails = modal.querySelector('.movie-details');
    const modalContent = modal.querySelector('.modal-content');

    movieDetails.innerHTML = `
        <section class="movie-poster" style="flex: 1;">
            <img src="${movie.Poster === 'N/A' ? 'assets/dog.png' : movie.Poster}" alt="${movie.Title} movie poster">
        </section>
        <section class="movie-info" style="flex: 1;">
            <h3>${movie.Title}</h3>
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
        </section>
    `;
    modalContent.style.background = '#FFBE98';
}

// Event handler for the submit event of search form,
// prevents form from submitting, hides any existing error message, 
// gets the search query, then fetches data from the OMDB API using search query,
// if API response is successful and current page is not 'favourites.html', 
// clears main content and pagination containers, displays search results, 
// sets found movies to search results, renders found movies, 
// sets current page to 1, if  current page is 'favourites.html', 
// does the same but clears favourites container instead of main content and pagination containers If the API response is not successful, it displays an error message
async function searchMovies(event) {
    event.preventDefault();

    const errorRef = document.querySelector('.errorMsg');

    errorRef.style.display = 'none';
    errorRef.innerHTML = ''

    const query = document.querySelector('.navigation__search-input').value;
    console.log(`Searching for: ${query}`); 

    try {
        const response = await apiHandler.fetchData(`http://www.omdbapi.com/?apikey=cf9e4f0d&s=${query}`);
        console.log("API Response:", response);

        const page = window.location.pathname.split('/').pop();

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

            const errorMessage = document.createElement('span');
            errorMessage.className = 'error-message';
            errorMessage.textContent = `${response.Error}`;

            errorRef.style.display = 'block';
            errorRef.appendChild(errorMessage);
        }
    } catch (error) {
        console.error('Something went wrong... Try again');
    }
}

// Displays search results by creating movie card for each movie 
// and appending it to movie cards container,
// if results container doesn't exist, 
// then creates it and appends it to found parent container,
// then clears results container and appends movie cards container to it
function displaySearchResults(movies) {
    let resultsContainer = document.querySelector('#results-container');

    if (!resultsContainer) {
        resultsContainer = document.createElement('section');
        resultsContainer.id = 'results-container';
        document.getElementById('foundParentContainer').appendChild(resultsContainer);
    }

    resultsContainer.innerHTML = '';

    const movieCardsContainer = document.createElement('section');
    movieCardsContainer.className = 'found-movie-cards-container';

    movies.forEach((movie) => {
        const movieCard = createMovieCard(movie);
        movieCardsContainer.appendChild(movieCard);
    });

    resultsContainer.appendChild(movieCardsContainer);
}