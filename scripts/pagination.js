'use strict';

function paginate(movies, currentPage, moviesPerPage) {
    const start = (currentPage - 1) * moviesPerPage;
    const end = start + moviesPerPage;
    return movies.slice(start, end);
}

export default { paginate };