'use strict';

import apiHandler from "./apiHandler.js";
import pagination from "./pagination.js";

let currentPage = 1;
const moviesPerPage = 4; 

window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');

    fetchTrailer();
    fetchTopMovies();
})

async function fetchTrailer() {
    try {
        const data = await apiHandler.fetchData('https://santosnr6.github.io/Data/movies.json');

        const selectedTrailers = [];
        for (let i = 0; i < 5; i++) {
            const index = Math.floor(Math.random() * data.length);
            selectedTrailers.push(data.splice(index, 1)[0]);
        }

const carousel = document.createElement('div');
carousel.className = 'carousel';

selectedTrailers.forEach((trailer, index) => {
    const trailerElement = renderTrailer(trailer, index);
    carousel.appendChild(trailerElement);
});

const carouselContainer = document.createElement('div');
carouselContainer.className = 'carousel-container';

carouselContainer.appendChild(carousel);

const trailerContainer = document.querySelector('.content-wrapper__aside.content-wrapper__aside--left');
trailerContainer.appendChild(carouselContainer);

let leftArrow = document.createElement('img');
leftArrow.className = 'carousel__arrow carousel__arrow--left';
leftArrow.src = 'assets/left arrow.png';
leftArrow.alt = 'Left Arrow';

let rightArrow = document.createElement('img');
rightArrow.className = 'carousel__arrow carousel__arrow--right';
rightArrow.src = 'assets/right arrow.png';
rightArrow.alt = 'Right Arrow';

carouselContainer.appendChild(leftArrow);
carouselContainer.appendChild(rightArrow);

        leftArrow.addEventListener('mousedown', function () {
            leftArrow.src = 'assets/left arrow active.png';
        });

        leftArrow.addEventListener('mouseup', function () {
            leftArrow.src = 'assets/left arrow.png';
        });

        rightArrow.addEventListener('mousedown', function () {
            rightArrow.src = 'assets/right arrow active.png';
        });

        rightArrow.addEventListener('mouseup', function () {
            rightArrow.src = 'assets/right arrow.png';
        });

        let currentTrailer = 0;
        document.querySelector('.carousel__arrow--left').addEventListener('click', () => {
            carousel.children[currentTrailer].style.display = 'none';
            currentTrailer = (currentTrailer - 1 + selectedTrailers.length) % selectedTrailers.length;
            carousel.children[currentTrailer].style.display = 'block';
        });
        document.querySelector('.carousel__arrow--right').addEventListener('click', () => {
            carousel.children[currentTrailer].style.display = 'none';
            currentTrailer = (currentTrailer + 1) % selectedTrailers.length;
            carousel.children[currentTrailer].style.display = 'block';
        });
    } catch (error) {
        console.log(error);
    }
}

function renderTrailer(trailer, index) {
    const trailerElement = document.createElement('iframe');
    trailerElement.src = trailer.trailer_link;
    trailerElement.className = 'carousel__trailer';
    trailerElement.style.display = index === 0 ? 'block' : 'none';
    trailerElement.width = "560";
    trailerElement.height = "315";
    trailerElement.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    trailerElement.allowFullscreen = true;
    return trailerElement;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

async function fetchTopMovies() {
    try {
        let movies = await apiHandler.fetchData('https://santosnr6.github.io/Data/movies.json');
        console.log(movies);

        shuffleArray(movies);

        const currentMovies = pagination.paginate(movies, currentPage, moviesPerPage);
        const moviesContainer = document.querySelector('.content-wrapper__aside.content-wrapper__aside--right');
moviesContainer.innerHTML = '';

const movieCardsContainer = document.createElement('div');
movieCardsContainer.className = 'movie-cards-container';

        currentMovies.forEach((movie) => { 
            const movieCard = document.createElement('div');
            movieCard.className = 'movie-card';

            const movieData = `
                <img src="${movie.poster}" alt="movie poster" class="activity-results__item">
                <h2 class="activity-results__item-header">${movie.title}</h2>
                <a href="${movie.trailer_link}" class="activity-results__item">Watch trailer</a>
            `;

            // <p class="activity-results__item">ImbID: ${movie.imdbid}</p>

            movieCard.innerHTML = movieData;
            movieCardsContainer.appendChild(movieCard);
        });

        moviesContainer.appendChild(movieCardsContainer);

        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination-container';

        const prevArrow = document.createElement('button');
        prevArrow.textContent = '<';
        prevArrow.className = 'pagination-arrow';
        prevArrow.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                fetchTopMovies();
            }
        });

        const nextPageText = document.createElement('span');
        nextPageText.textContent = `Page ${currentPage} of ${Math.ceil(movies.length / moviesPerPage)}`;

        const nextArrow = document.createElement('button');
        nextArrow.textContent = '>';
        nextArrow.className = 'pagination-arrow';
        nextArrow.addEventListener('click', () => {
            if (currentPage < Math.ceil(movies.length / moviesPerPage)) {
                currentPage++;
                fetchTopMovies();
            }
        });

        paginationContainer.appendChild(prevArrow);
        paginationContainer.appendChild(nextPageText);
        paginationContainer.appendChild(nextArrow);

        moviesContainer.appendChild(paginationContainer);
    } catch (error) {
        console.log(error);
    }
}