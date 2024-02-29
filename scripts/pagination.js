'use strict';

// Takes list of movies, current page number and 
// number of movies per page as arguments,
// divides list of movies into pages,
// each page contains a certain number of movies,
// returns group of movies that corresponds to the current page number
function paginate(movies, currentPage, moviesPerPage) {
    const start = (currentPage - 1) * moviesPerPage;
    const end = start + moviesPerPage;
    return movies.slice(start, end);
}

export default { paginate };